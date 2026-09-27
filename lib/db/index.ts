import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { getMongoDb, isMongoConfigured } from '@/lib/mongodb';
import {
  User,
  JournalEntry,
  JournalReflection,
  WeeklySynthesis,
  JournalSession,
  ChatMessage,
  ActionStep,
  ReflectionMode,
} from './types';

interface DatabaseSchema {
  users: User[];
  entries: JournalEntry[];
  syntheses: WeeklySynthesis[];
  sessions: JournalSession[];
  activeSessionUserId?: string | null;
}

function getDbFilePath(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.TMPDIR) {
    return '/tmp/journal_store.json';
  }
  return path.join(process.cwd(), '.data', 'journal_store.json');
}

// Default initial state
let memoryDb: DatabaseSchema = {
  activeSessionUserId: null,
  users: [],
  entries: [],
  syntheses: [],
  sessions: [],
};

let isInitialized = false;

async function initDb(): Promise<void> {
  if (isInitialized) return;
  const dbFile = getDbFilePath();
  try {
    const dir = path.dirname(dbFile);
    await fs.mkdir(dir, { recursive: true });
    try {
      const data = await fs.readFile(dbFile, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && Array.isArray(parsed.users)) {
        memoryDb = {
          ...parsed,
          sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
          entries: Array.isArray(parsed.entries) ? parsed.entries : [],
          syntheses: Array.isArray(parsed.syntheses) ? parsed.syntheses : [],
        };
      }
    } catch {
      await persistDb();
    }
    isInitialized = true;
  } catch (err) {
    console.error('Failed to initialize database store:', err);
    isInitialized = true;
  }
}

async function persistDb(): Promise<void> {
  const dbFile = getDbFilePath();
  try {
    const dir = path.dirname(dbFile);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(dbFile, JSON.stringify(memoryDb, null, 2), 'utf-8');
  } catch (err) {
    try {
      await fs.writeFile('/tmp/journal_store.json', JSON.stringify(memoryDb, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write database file:', e);
    }
  }
}

// Check MongoDB connection status
export async function getDbStatus(): Promise<{
  connected: boolean;
  type: 'mongodb' | 'file_fallback';
  message: string;
}> {
  if (isMongoConfigured()) {
    const db = await getMongoDb();
    if (db) {
      return {
        connected: true,
        type: 'mongodb',
        message: 'Connected to MongoDB database instance.',
      };
    }
  }
  return {
    connected: false,
    type: 'file_fallback',
    message: 'Using local file storage (.data/journal_store.json). Set MONGODB_URI to connect to MongoDB Compass / Atlas.',
  };
}

// ================= User Operations =================

export function getDeterministicUserId(email: string): string {
  const clean = email.toLowerCase().trim();
  const hash = crypto.createHash('sha256').update(clean).digest('hex').slice(0, 12);
  return `usr_${hash}`;
}

export async function findUserById(id: string): Promise<User | null> {
  const db = await getMongoDb();
  if (db) {
    const user = await db.collection<User>('users').findOne({ id });
    if (user) {
      const { _id, ...cleanUser } = user as any;
      return cleanUser;
    }
    return null;
  }

  await initDb();
  return memoryDb.users.find((u) => u.id === id) || null;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const cleanEmail = email.toLowerCase().trim();
  const db = await getMongoDb();
  if (db) {
    const user = await db.collection<User>('users').findOne({ email: cleanEmail });
    if (user) {
      const { _id, ...cleanUser } = user as any;
      return cleanUser;
    }
    return null;
  }

  await initDb();
  return memoryDb.users.find((u) => u.email.toLowerCase() === cleanEmail) || null;
}

export async function createOrUpdateUser(userData: {
  email: string;
  name: string;
  avatarUrl?: string;
  provider: 'google' | 'github' | 'email' | 'credentials';
  role?: 'user' | 'admin';
  password?: string;
}): Promise<User> {
  const cleanEmail = userData.email.toLowerCase().trim();
  const now = new Date().toISOString();

  const db = await getMongoDb();
  if (db) {
    const usersCol = db.collection<User>('users');
    const existing = await usersCol.findOne({ email: cleanEmail });

    if (existing) {
      const updatedUser: User = {
        id: existing.id,
        email: cleanEmail,
        name: userData.name || existing.name,
        avatarUrl: userData.avatarUrl || existing.avatarUrl,
        provider: userData.provider || existing.provider,
        role: userData.role || existing.role,
        createdAt: existing.createdAt || now,
        lastLoginAt: now,
        password: userData.password || existing.password,
      };

      await usersCol.updateOne(
        { id: existing.id },
        { $set: updatedUser },
        { upsert: true }
      );
      await setActiveSessionUserId(updatedUser.id);
      return updatedUser;
    }

    const newUser: User = {
      id: getDeterministicUserId(cleanEmail),
      email: cleanEmail,
      name: userData.name || cleanEmail.split('@')[0],
      avatarUrl:
        userData.avatarUrl ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`,
      provider: userData.provider,
      role: userData.role || (cleanEmail.includes('admin') ? 'admin' : 'user'),
      createdAt: now,
      lastLoginAt: now,
      password: userData.password,
    };

    await usersCol.insertOne(newUser as any);
    await setActiveSessionUserId(newUser.id);
    return newUser;
  }

  // Fallback storage
  await initDb();
  const existingIndex = memoryDb.users.findIndex(
    (u) => u.email.toLowerCase() === cleanEmail
  );

  if (existingIndex >= 0) {
    const existing = memoryDb.users[existingIndex];
    const updated: User = {
      ...existing,
      name: userData.name || existing.name,
      avatarUrl: userData.avatarUrl || existing.avatarUrl,
      lastLoginAt: now,
      role: userData.role || existing.role,
      password: userData.password || existing.password,
    };
    memoryDb.users[existingIndex] = updated;
    memoryDb.activeSessionUserId = updated.id;
    await persistDb();
    return updated;
  }

  const newUser: User = {
    id: getDeterministicUserId(cleanEmail),
    email: cleanEmail,
    name: userData.name || cleanEmail.split('@')[0],
    avatarUrl:
      userData.avatarUrl ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`,
    provider: userData.provider,
    role: userData.role || (cleanEmail.includes('admin') ? 'admin' : 'user'),
    createdAt: now,
    lastLoginAt: now,
    password: userData.password,
  };

  memoryDb.users.push(newUser);
  memoryDb.activeSessionUserId = newUser.id;
  await persistDb();
  return newUser;
}

export async function getActiveSessionUser(): Promise<User | null> {
  await initDb();
  if (memoryDb.activeSessionUserId) {
    return await findUserById(memoryDb.activeSessionUserId);
  }
  return null;
}

export async function setActiveSessionUserId(userId: string | null): Promise<void> {
  await initDb();
  memoryDb.activeSessionUserId = userId;
  await persistDb();
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getMongoDb();
  if (db) {
    const users = await db.collection<User>('users').find({}).toArray();
    return users.map((u) => {
      const { _id, ...rest } = u as any;
      return rest;
    });
  }

  await initDb();
  return [...memoryDb.users];
}

// ================= Journal Entry Operations =================

export async function listEntries(
  userId: string,
  options?: { mood?: string; tag?: string; search?: string }
): Promise<JournalEntry[]> {
  const db = await getMongoDb();
  if (db) {
    const query: Record<string, any> = { userId };
    if (options?.mood) {
      query.mood = options.mood;
    }
    if (options?.tag) {
      query.tags = options.tag.toLowerCase();
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
      ];
    }

    const entries = await db
      .collection<JournalEntry>('entries')
      .find(query)
      .sort({ date: -1, createdAt: -1 })
      .toArray();

    return entries.map((e) => {
      const { _id, ...cleanEntry } = e as any;
      return cleanEntry;
    });
  }

  await initDb();
  let results = memoryDb.entries.filter((entry) => entry.userId === userId);

  if (options?.mood) {
    results = results.filter((e) => e.mood === options.mood);
  }
  if (options?.tag) {
    const t = options.tag.toLowerCase();
    results = results.filter((e) => e.tags.some((tag) => tag.toLowerCase() === t));
  }
  if (options?.search) {
    const q = options.search.toLowerCase();
    results = results.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.content.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getEntryById(id: string, userId: string): Promise<JournalEntry | null> {
  const db = await getMongoDb();
  if (db) {
    const entry = await db.collection<JournalEntry>('entries').findOne({ id, userId });
    if (entry) {
      const { _id, ...cleanEntry } = entry as any;
      return cleanEntry;
    }
    return null;
  }

  await initDb();
  const entry = memoryDb.entries.find((e) => e.id === id && e.userId === userId);
  return entry || null;
}

export async function createEntry(
  userId: string,
  data: {
    title: string;
    content: string;
    mood: JournalEntry['mood'];
    tags?: string[];
    date?: string;
  }
): Promise<JournalEntry> {
  const now = new Date().toISOString();
  const newEntry: JournalEntry = {
    id: `ent_${crypto.randomUUID().slice(0, 10)}`,
    userId,
    title: data.title.trim() || 'Untitled Journal Reflection',
    content: data.content.trim(),
    mood: data.mood || 'reflective',
    tags: (data.tags || []).map((t) => t.trim().toLowerCase()).filter(Boolean),
    date: data.date || now.split('T')[0],
    createdAt: now,
    updatedAt: now,
    reflection: null,
  };

  const db = await getMongoDb();
  if (db) {
    await db.collection<JournalEntry>('entries').insertOne(newEntry as any);
    return newEntry;
  }

  await initDb();
  memoryDb.entries.unshift(newEntry);
  await persistDb();
  return newEntry;
}

export async function updateEntry(
  id: string,
  userId: string,
  data: Partial<Pick<JournalEntry, 'title' | 'content' | 'mood' | 'tags' | 'date'>>
): Promise<JournalEntry | null> {
  const existing = await getEntryById(id, userId);
  if (!existing) return null;

  const updated: JournalEntry = {
    ...existing,
    title: data.title !== undefined ? data.title.trim() : existing.title,
    content: data.content !== undefined ? data.content.trim() : existing.content,
    mood: data.mood || existing.mood,
    tags: data.tags !== undefined ? data.tags.map((t) => t.trim().toLowerCase()) : existing.tags,
    date: data.date || existing.date,
    updatedAt: new Date().toISOString(),
  };

  const db = await getMongoDb();
  if (db) {
    await db.collection<JournalEntry>('entries').updateOne({ id, userId }, { $set: updated });
    return updated;
  }

  await initDb();
  const index = memoryDb.entries.findIndex((e) => e.id === id && e.userId === userId);
  if (index !== -1) {
    memoryDb.entries[index] = updated;
    await persistDb();
  }
  return updated;
}

export async function deleteEntry(id: string, userId: string): Promise<boolean> {
  const db = await getMongoDb();
  if (db) {
    const res = await db.collection('entries').deleteOne({ id, userId });
    return res.deletedCount > 0;
  }

  await initDb();
  const index = memoryDb.entries.findIndex((e) => e.id === id && e.userId === userId);
  if (index === -1) return false;

  memoryDb.entries.splice(index, 1);
  await persistDb();
  return true;
}

export async function saveReflection(
  entryId: string,
  userId: string,
  reflection: JournalReflection
): Promise<JournalEntry | null> {
  const existing = await getEntryById(entryId, userId);
  if (!existing) return null;

  const now = new Date().toISOString();
  const updated = {
    ...existing,
    reflection,
    updatedAt: now,
  };

  const db = await getMongoDb();
  if (db) {
    await db.collection<JournalEntry>('entries').updateOne(
      { id: entryId, userId },
      { $set: { reflection, updatedAt: now } }
    );
    return updated;
  }

  await initDb();
  const index = memoryDb.entries.findIndex((e) => e.id === entryId && e.userId === userId);
  if (index !== -1) {
    memoryDb.entries[index] = updated;
    await persistDb();
  }
  return updated;
}

// ================= Synthesis Operations =================

export async function saveWeeklySynthesis(
  userId: string,
  synthesisData: Omit<WeeklySynthesis, 'id' | 'userId' | 'generatedAt'>
): Promise<WeeklySynthesis> {
  const now = new Date().toISOString();
  const newSynthesis: WeeklySynthesis = {
    id: `syn_${crypto.randomUUID().slice(0, 10)}`,
    userId,
    ...synthesisData,
    generatedAt: now,
  };

  const db = await getMongoDb();
  if (db) {
    await db.collection<WeeklySynthesis>('syntheses').insertOne(newSynthesis as any);
    return newSynthesis;
  }

  await initDb();
  memoryDb.syntheses.unshift(newSynthesis);
  await persistDb();
  return newSynthesis;
}

export async function getLatestSynthesis(userId: string): Promise<WeeklySynthesis | null> {
  const db = await getMongoDb();
  if (db) {
    const syn = await db
      .collection<WeeklySynthesis>('syntheses')
      .find({ userId })
      .sort({ generatedAt: -1 })
      .limit(1)
      .toArray();

    if (syn.length > 0) {
      const { _id, ...cleanSyn } = syn[0] as any;
      return cleanSyn;
    }
    return null;
  }

  await initDb();
  const syn = memoryDb.syntheses.find((s) => s.userId === userId);
  return syn || null;
}

// ================= System & Metrics =================

export async function getSystemMetrics() {
  const db = await getMongoDb();
  if (db) {
    const totalUsers = await db.collection('users').countDocuments();
    const totalEntries = await db.collection('entries').countDocuments();
    const entriesWithReflections = await db
      .collection('entries')
      .countDocuments({ reflection: { $ne: null } });

    const allEntries = await db.collection<JournalEntry>('entries').find({}).toArray();
    const moodDistribution: Record<string, number> = {};
    for (const entry of allEntries) {
      if (entry.mood) {
        moodDistribution[entry.mood] = (moodDistribution[entry.mood] || 0) + 1;
      }
    }

    const recentUsersRaw = await db
      .collection<User>('users')
      .find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    const recentUsers = recentUsersRaw.map((u) => {
      const { _id, ...rest } = u as any;
      return rest;
    });

    return {
      totalUsers,
      totalEntries,
      entriesWithReflections,
      moodDistribution,
      recentUsers,
    };
  }

  await initDb();
  const totalUsers = memoryDb.users.length;
  const totalEntries = memoryDb.entries.length;
  const entriesWithReflections = memoryDb.entries.filter((e) => !!e.reflection).length;

  const moodDistribution: Record<string, number> = {};
  for (const entry of memoryDb.entries) {
    moodDistribution[entry.mood] = (moodDistribution[entry.mood] || 0) + 1;
  }

  return {
    totalUsers,
    totalEntries,
    entriesWithReflections,
    moodDistribution,
    recentUsers: memoryDb.users.slice(0, 5),
  };
}

// ================= Interactive Sessions & Action Steps =================

export async function listJournalSessions(userId: string): Promise<JournalSession[]> {
  const db = await getMongoDb();
  if (db) {
    const sessions = await db
      .collection<JournalSession>('sessions')
      .find({ userId })
      .sort({ updatedAt: -1 })
      .toArray();

    return sessions.map((s) => {
      const { _id, ...cleanSession } = s as any;
      return cleanSession;
    });
  }

  await initDb();
  const userSessions = memoryDb.sessions.filter((s) => s.userId === userId);
  return userSessions.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getJournalSession(
  sessionId: string,
  userId: string
): Promise<JournalSession | null> {
  const db = await getMongoDb();
  if (db) {
    const session = await db
      .collection<JournalSession>('sessions')
      .findOne({ id: sessionId, userId });

    if (session) {
      const { _id, ...cleanSession } = session as any;
      return cleanSession;
    }
    return null;
  }

  await initDb();
  const session = memoryDb.sessions.find((s) => s.id === sessionId && s.userId === userId);
  return session || null;
}

export async function createJournalSession(
  userId: string,
  title?: string
): Promise<JournalSession> {
  const now = new Date().toISOString();
  const newSession: JournalSession = {
    id: `sess_${crypto.randomUUID().slice(0, 10)}`,
    userId,
    title: title || 'New Reflection Session',
    createdAt: now,
    updatedAt: now,
    messages: [],
  };

  const db = await getMongoDb();
  if (db) {
    await db.collection<JournalSession>('sessions').insertOne(newSession as any);
    return newSession;
  }

  await initDb();
  memoryDb.sessions.unshift(newSession);
  await persistDb();
  return newSession;
}

export async function addMessageToSession(
  sessionId: string,
  userId: string,
  messageData: {
    role: 'user' | 'assistant';
    content: string;
    mode?: ReflectionMode;
    actionSteps?: ActionStep[];
    moodTag?: string;
    sentimentScore?: number;
    insights?: string[];
    growthPrompt?: string;
  }
): Promise<ChatMessage> {
  let session = await getJournalSession(sessionId, userId);
  const now = new Date().toISOString();

  if (!session) {
    session = await createJournalSession(userId, messageData.content.slice(0, 40) + '...');
  }

  const messageId = `msg_${crypto.randomUUID().slice(0, 10)}`;
  const chatMessage: ChatMessage = {
    id: messageId,
    sessionId: session.id,
    userId,
    role: messageData.role,
    content: messageData.content,
    mode: messageData.mode,
    createdAt: now,
    actionSteps: messageData.actionSteps,
    moodTag: messageData.moodTag,
    sentimentScore: messageData.sentimentScore,
    insights: messageData.insights,
    growthPrompt: messageData.growthPrompt,
  };

  session.messages.push(chatMessage);
  session.updatedAt = now;

  if (session.messages.length <= 2 && messageData.role === 'user') {
    const cleanTitle = messageData.content.replace(/\n+/g, ' ').trim().slice(0, 38);
    session.title = cleanTitle.length > 0 ? cleanTitle : 'Reflection Session';
  }

  const db = await getMongoDb();
  if (db) {
    await db.collection<JournalSession>('sessions').updateOne(
      { id: session.id, userId },
      { $set: { messages: session.messages, title: session.title, updatedAt: now } }
    );
    return chatMessage;
  }

  await initDb();
  const memSess = memoryDb.sessions.find((s) => s.id === session!.id);
  if (memSess) {
    memSess.messages = session.messages;
    memSess.title = session.title;
    memSess.updatedAt = now;
    await persistDb();
  }
  return chatMessage;
}

export async function toggleActionStep(
  sessionId: string,
  messageId: string,
  stepId: string,
  userId: string
): Promise<boolean> {
  const session = await getJournalSession(sessionId, userId);
  if (!session) return false;

  const msg = session.messages.find((m) => m.id === messageId);
  if (!msg || !msg.actionSteps) return false;

  const step = msg.actionSteps.find((st) => st.id === stepId);
  if (!step) return false;

  step.completed = !step.completed;
  session.updatedAt = new Date().toISOString();

  const db = await getMongoDb();
  if (db) {
    await db.collection<JournalSession>('sessions').updateOne(
      { id: sessionId, userId },
      { $set: { messages: session.messages, updatedAt: session.updatedAt } }
    );
    return true;
  }

  await initDb();
  const memSess = memoryDb.sessions.find((s) => s.id === sessionId && s.userId === userId);
  if (memSess) {
    memSess.messages = session.messages;
    memSess.updatedAt = session.updatedAt;
    await persistDb();
  }
  return true;
}

export async function deleteJournalSession(sessionId: string, userId: string): Promise<boolean> {
  const db = await getMongoDb();
  if (db) {
    const res = await db.collection('sessions').deleteOne({ id: sessionId, userId });
    return res.deletedCount > 0;
  }

  await initDb();
  const initialCount = memoryDb.sessions.length;
  memoryDb.sessions = memoryDb.sessions.filter(
    (s) => !(s.id === sessionId && s.userId === userId)
  );
  if (memoryDb.sessions.length !== initialCount) {
    await persistDb();
    return true;
  }
  return false;
}

export async function saveBulkSessions(userId: string, sessions: JournalSession[]): Promise<void> {
  if (!Array.isArray(sessions) || sessions.length === 0) return;
  const db = await getMongoDb();
  if (db) {
    const col = db.collection<JournalSession>('sessions');
    for (const sess of sessions) {
      if (!sess.id) continue;
      const cleanSess = { ...sess, userId };
      await col.updateOne(
        { id: sess.id, userId },
        { $set: cleanSess },
        { upsert: true }
      );
    }
    return;
  }

  await initDb();
  for (const sess of sessions) {
    if (!sess.id) continue;
    const cleanSess = { ...sess, userId };
    const idx = memoryDb.sessions.findIndex((s) => s.id === sess.id && s.userId === userId);
    if (idx >= 0) {
      memoryDb.sessions[idx] = cleanSess;
    } else {
      memoryDb.sessions.unshift(cleanSess);
    }
  }
  await persistDb();
}

export async function saveBulkEntries(userId: string, entries: JournalEntry[]): Promise<void> {
  if (!Array.isArray(entries) || entries.length === 0) return;
  const db = await getMongoDb();
  if (db) {
    const col = db.collection<JournalEntry>('entries');
    for (const entry of entries) {
      if (!entry.id) continue;
      const cleanEntry = { ...entry, userId };
      await col.updateOne(
        { id: entry.id, userId },
        { $set: cleanEntry },
        { upsert: true }
      );
    }
    return;
  }

  await initDb();
  for (const entry of entries) {
    if (!entry.id) continue;
    const cleanEntry = { ...entry, userId };
    const idx = memoryDb.entries.findIndex((e) => e.id === entry.id && e.userId === userId);
    if (idx >= 0) {
      memoryDb.entries[idx] = cleanEntry;
    } else {
      memoryDb.entries.unshift(cleanEntry);
    }
  }
  await persistDb();
}
