import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;
let connectionFailed = false;

function getRawUri(): string {
  let uri = process.env.MONGODB_URI || process.env.MONGO_URL || '';
  uri = uri.trim();
  // Strip quotes if environment variable wrapped it in quotes (e.g., "mongodb://...")
  if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
    uri = uri.slice(1, -1).trim();
  }
  return uri;
}

export function isMongoConfigured(): boolean {
  const uri = getRawUri();
  return Boolean(uri && (uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://')));
}

export async function getMongoClient(): Promise<MongoClient | null> {
  if (!isMongoConfigured() || connectionFailed) {
    return null;
  }

  if (clientPromise) {
    try {
      const existing = await clientPromise;
      if (existing) return existing;
    } catch {
      clientPromise = null;
      connectionFailed = true;
      return null;
    }
  }

  const uri = getRawUri();

  try {
    client = new MongoClient(uri, {
      connectTimeoutMS: 2000,
      serverSelectionTimeoutMS: 2000,
    });

    clientPromise = client.connect().catch((err) => {
      clientPromise = null;
      client = null;
      connectionFailed = true;
      console.warn(`[MongoDB] Notice: Could not connect to MongoDB URI (${err?.message || 'Server unavailable'}). Falling back to local store.`);
      return null as any;
    });

    const connectedClient = await clientPromise;
    if (!connectedClient) {
      connectionFailed = true;
      return null;
    }
    return connectedClient;
  } catch (err: any) {
    console.warn(`[MongoDB] Notice: Initialization skipped (${err?.message || 'Invalid URI'}). Falling back to local store.`);
    clientPromise = null;
    client = null;
    connectionFailed = true;
    return null;
  }
}

export async function getMongoDb(): Promise<Db | null> {
  try {
    const mongoClient = await getMongoClient();
    if (!mongoClient) return null;
    const DB_NAME = process.env.MONGODB_DB || 'reflectai_db';
    return mongoClient.db(DB_NAME);
  } catch {
    return null;
  }
}
