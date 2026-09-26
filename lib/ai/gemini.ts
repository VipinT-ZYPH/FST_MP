import { GoogleGenAI } from '@google/genai';
import {
  JournalReflection,
  WeeklySynthesis,
  JournalEntry,
  ActionStep,
  ReflectionMode,
} from '@/lib/db/types';

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
}

/**
 * Generates an empathetic, mindful AI reflection on a user's journal entry.
 */
export async function generateJournalReflection(entry: {
  title: string;
  content: string;
  mood: string;
  date: string;
}): Promise<JournalReflection> {
  const client = getGeminiClient();

  if (!client) {
    console.warn('GEMINI_API_KEY not configured or using placeholder; using heuristic fallback reflection.');
    return generateFallbackReflection(entry);
  }

  const prompt = `You are an empathetic, emotionally intelligent, and philosophically grounded personal reflection mentor.
Analyze this journal entry and provide a deeply thoughtful reflection.

Journal Date: ${entry.date}
Declared Mood: ${entry.mood}
Title: ${entry.title}
Content:
"""
${entry.content}
"""

Respond ONLY with a valid JSON object matching this schema exactly:
{
  "summary": "1 to 2 sentences summarizing the core narrative and emotional essence of the entry.",
  "mindfulReflection": "A warm, insightful, and compassionate reflection (approx. 80-120 words) that highlights the writer's underlying strengths, emotional currents, and subtle realizations.",
  "keyInsights": [
    "Insight 1 (concise observation about patterns, values, or mental models)",
    "Insight 2",
    "Insight 3"
  ],
  "sentiment": {
    "mood": "Nuanced descriptive mood phrase (e.g., 'Grounded & Contemplative', 'Cautiously Hopeful', 'Vulnerable yet Resilient')",
    "score": 8.5, // Float between 1.0 (deep distress) and 10.0 (euphoric fulfillment)
    "positivity": "positive", // Must be one of: "positive", "neutral", "challenging"
    "emotionalTones": ["Tension", "Resolution", "Gratitude"] // Array of 2 to 4 emotional adjectives
  },
  "growthPrompt": "A penetrating, compassionate open-ended question for the writer to contemplate next.",
  "actionableAdvice": [
    "Gentle micro-habit or mindfulness practice 1",
    "Gentle micro-habit or mindfulness practice 2"
  ]
}`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error('Empty response from Gemini API');
    }

    const parsed = JSON.parse(text);
    return {
      summary: parsed.summary || 'A thoughtful moment of personal introspection.',
      mindfulReflection:
        parsed.mindfulReflection ||
        'Writing down your thoughts is in itself a grounding practice. You demonstrated honesty and presence in this entry.',
      keyInsights: Array.isArray(parsed.keyInsights) && parsed.keyInsights.length > 0
        ? parsed.keyInsights
        : ['Honest observation of your daily rhythm.', 'Self-awareness is the first step toward intentional change.'],
      sentiment: {
        mood: parsed.sentiment?.mood || 'Reflective',
        score: typeof parsed.sentiment?.score === 'number' ? parsed.sentiment.score : 7.0,
        positivity: ['positive', 'neutral', 'challenging'].includes(parsed.sentiment?.positivity)
          ? parsed.sentiment.positivity
          : 'neutral',
        emotionalTones: Array.isArray(parsed.sentiment?.emotionalTones)
          ? parsed.sentiment.emotionalTones
          : ['Introspective', 'Observant'],
      },
      growthPrompt:
        parsed.growthPrompt ||
        'What is one small choice you can make today that honors the feelings you expressed in this entry?',
      actionableAdvice: Array.isArray(parsed.actionableAdvice) && parsed.actionableAdvice.length > 0
        ? parsed.actionableAdvice
        : ['Take three calm diaphragmatic breaths whenever you feel your mind rushing.'],
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Gemini reflection generation failed, utilizing fallback:', error);
    return generateFallbackReflection(entry);
  }
}

/**
 * Synthesizes multiple journal entries over a week/period into overarching insights.
 */
export async function generateWeeklySynthesis(
  entries: JournalEntry[],
  periodLabel: string = 'Recent Days'
): Promise<Omit<WeeklySynthesis, 'id' | 'userId' | 'generatedAt'>> {
  const client = getGeminiClient();

  if (!client || entries.length === 0) {
    return generateFallbackSynthesis(entries, periodLabel);
  }

  const entriesDigest = entries
    .slice(0, 15) // Digest of up to 15 entries
    .map(
      (e, i) =>
        `Entry #${i + 1} (${e.date}, Mood: ${e.mood}, Title: "${e.title}"):\n${e.content.slice(0, 600)}`
    )
    .join('\n\n---\n\n');

  const prompt = `You are an empathetic mindfulness counselor and personal growth coach.
Synthesize these journal entries written across "${periodLabel}" into an encouraging, holistic reflection on the person's journey.

Entries:
${entriesDigest}

Respond ONLY with a valid JSON object matching this schema:
{
  "period": "${periodLabel}",
  "overview": "A compassionate 2-3 sentence overarching summary of where the writer has been navigating mentally and emotionally.",
  "keyThemes": ["Theme 1 (e.g., Finding calm amidst external urgency)", "Theme 2", "Theme 3"],
  "emotionalLandscape": "A paragraph describing the emotional trajectory (shifts in anxiety, moments of gratitude, breakthroughs).",
  "growthMilestones": ["Milestone 1", "Milestone 2", "Milestone 3"],
  "guidingQuestion": "An inspiring, overarching life question for their upcoming week."
}`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const text = response.text?.trim();
    if (!text) throw new Error('Empty response from Gemini API');

    const parsed = JSON.parse(text);
    return {
      period: parsed.period || periodLabel,
      overview: parsed.overview || 'Your recent journal entries reflect a continuous commitment to self-exploration and authenticity.',
      keyThemes: parsed.keyThemes || ['Mindful presence', 'Navigating relationships', 'Personal pacing'],
      emotionalLandscape: parsed.emotionalLandscape || 'Your emotional spectrum shows balanced oscillation between deep curiosity and restorative quiet.',
      growthMilestones: parsed.growthMilestones || ['Showed willingness to sit with uncertainty', 'Celebrated small daily rituals'],
      guidingQuestion: parsed.guidingQuestion || 'What would it feel like to trust your own instincts more deeply this week?',
    };
  } catch (err) {
    console.error('Synthesis generation error:', err);
    return generateFallbackSynthesis(entries, periodLabel);
  }
}

// Graceful fallback generators
function generateFallbackReflection(entry: {
  title: string;
  content: string;
  mood: string;
}): JournalReflection {
  const contentLen = entry.content.length;
  const isChallenging = ['anxious', 'melancholy'].includes(entry.mood.toLowerCase());
  const isHighPositivity = ['grateful', 'happy', 'energized', 'peaceful'].includes(entry.mood.toLowerCase());

  return {
    summary: `Your entry "${entry.title}" articulates ${
      isChallenging ? 'vulnerable thoughts and challenges with courage' : 'a moment of meaningful clarity and perspective'
    }.`,
    mindfulReflection: `Writing down your inner dialogue is a profound act of self-care. Across your reflection, there is an honest willingness to observe your thoughts without harsh judgment. Embracing the nuance of how you feel allows you to integrate both light and shadow into continuous personal maturity.`,
    keyInsights: [
      `Naming emotions directly decreases their cognitive hold and increases your psychological agency.`,
      `Your thoughts demonstrate a strong instinct toward thoughtful self-attunement.`,
      `Allowing yourself space to express ${entry.mood} moments creates room for authentic resilience.`
    ],
    sentiment: {
      mood: isHighPositivity ? 'Grounded & Uplifting' : isChallenging ? 'Vulnerable & Receptive' : 'Observant & Centered',
      score: isHighPositivity ? 8.4 : isChallenging ? 5.8 : 7.2,
      positivity: isHighPositivity ? 'positive' : isChallenging ? 'challenging' : 'neutral',
      emotionalTones: isHighPositivity
        ? ['Gratitude', 'Vitality', 'Presence']
        : isChallenging
        ? ['Pondering', 'Uncertainty', 'Openness']
        : ['Clarity', 'Equanimity', 'Focus']
    },
    growthPrompt: 'If you were to treat yourself with the exact same compassion you offer a close friend, what would you say to yourself right now?',
    actionableAdvice: [
      'Pause for two uninterrupted minutes before moving on to your next task.',
      'Jot down one thing that brought unearned ease or quiet comfort into your day.'
    ],
    generatedAt: new Date().toISOString(),
  };
}

function generateFallbackSynthesis(entries: JournalEntry[], periodLabel: string) {
  return {
    period: periodLabel,
    overview: `Over this period across ${entries.length} reflections, your writing demonstrates steady engagement with your inner landscape, embracing both quiet moments and active contemplations.`,
    keyThemes: ['Cultivating self-awareness', 'Navigating daily balance', 'Recognizing genuine priorities'],
    emotionalLandscape: 'A healthy trajectory from daily busyness to reflective grounding, demonstrating resilience and attentiveness.',
    growthMilestones: [
      'Consistently taking time to record candid thoughts',
      'Reflecting with emotional nuance rather than binary judgment'
    ],
    guidingQuestion: 'What is the most nourishing lesson this week has offered you, and how will you carry it forward?',
  };
}

/**
 * Generates conversational feedback, mindful reflections, or actionable steps from user input.
 */
export async function generateChatFeedback(params: {
  userMessage: string;
  mode: ReflectionMode;
  history?: { role: 'user' | 'assistant'; content: string }[];
}): Promise<{
  content: string;
  actionSteps?: ActionStep[];
  moodTag?: string;
  sentimentScore?: number;
  insights?: string[];
  growthPrompt?: string;
}> {
  const client = getGeminiClient();
  const { userMessage, mode, history = [] } = params;

  if (!client) {
    return generateFallbackChatFeedback(userMessage, mode);
  }

  const historyContext = history.slice(-6).map((h) => `${h.role === 'user' ? 'User' : 'Journal Companion'}: ${h.content}`).join('\n\n');

  const modeInstructions = {
    action_steps: `PRIMARY OBJECTIVE: Break down the user's situation/thoughts into clear, prioritized, actionable steps.
Transform vague overwhelm, dilemmas, or complex challenges into tangible micro-actions.
Provide:
1. A warm, validating introductory paragraph acknowledging the essence of what they shared.
2. A structured set of 3 to 6 concrete, bite-sized "actionSteps" (with clear action verbs and recommended timeframes like 'Next 10 mins', 'Today', 'This week').
3. 2 key psychological insights or practical rules of thumb.`,
    
    reflection: `PRIMARY OBJECTIVE: Provide a deeply empathetic, psychologically grounded reflection.
Validate their emotions, help them reframe cognitive distortions, and offer wisdom on underlying motivations.
Provide:
1. An empathetic, validating reflection narrative (approx 120-180 words) written with warmth and clarity.
2. 2-3 key insights on patterns or values.
3. 1 thoughtful open-ended contemplative question.
4. Optional 1-2 gentle mindful practices as actionSteps.`,

    balanced: `PRIMARY OBJECTIVE: Balance deep emotional validation with structured, pragmatic next steps.
Provide:
1. An insightful reflection that validates their emotional reality and brings calm perspective.
2. 3 to 5 realistic, high-impact action steps to regain agency.
3. 2 key insights and 1 guiding growth question.`,

    socratic: `PRIMARY OBJECTIVE: Socratic inquiry & exploration.
Do not lecture or solve immediately. Instead, reflect back the core tension and ask 2 to 3 incisive, compassionate questions that help them discover the answer themselves.
Provide:
1. A concise mirror of their situation that surfaces unstated assumptions.
2. 2-3 penetrating reflection prompts or inquiries.
3. 1-2 small immediate clarifying action steps.`,
  }[mode] || `Break down the user's entry with thoughtful feedback and clear actionable steps.`;

  const prompt = `You are ReflectAI, an emotionally intelligent, pragmatic personal journal mentor and thought partner.
The user is speaking with you conversationally to process their thoughts, emotions, decisions, or daily challenges.

Selected Interaction Mode: ${mode.toUpperCase()}
Instructions for this mode:
${modeInstructions}

Recent Conversation History:
${historyContext ? historyContext : '(Starting a new journal session)'}

Current User Message:
"""
${userMessage}
"""

Respond ONLY with a valid JSON object matching this schema:
{
  "content": "Your main conversational reply text. Format with elegant, friendly markdown (use paragraphs, bullet points if helpful). Speak directly to the user with warmth, clarity, and zero clinical jargon.",
  "actionSteps": [
    {
      "id": "step_1",
      "task": "Clear, imperative verb action (e.g., 'Take 5 minutes to dump everything onto a blank sheet of paper')",
      "timeframe": "Next 10 mins", // e.g., 'Next 15 mins', 'Today', 'Tomorrow morning', 'This week'
      "completed": false
    }
  ],
  "moodTag": "Concise mood or state transition (e.g., 'Overwhelmed → Focused', 'Reflective & Hopeful', 'Seeking Direction')",
  "sentimentScore": 7.5, // Float between 1.0 and 10.0
  "insights": [
    "Key takeaway or reframing insight 1",
    "Key takeaway or reframing insight 2"
  ],
  "growthPrompt": "A single thoughtful question to leave them with for further reflection"
}`;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const text = response.text?.trim();
    if (!text) throw new Error('Empty response from Gemini');

    const parsed = JSON.parse(text);
    return {
      content: parsed.content || 'Thank you for sharing that with me. Let us break this down and find steady ground.',
      actionSteps: Array.isArray(parsed.actionSteps)
        ? parsed.actionSteps.map((step: any, index: number) => ({
            id: step.id || `step_${Date.now()}_${index}`,
            task: step.task || String(step),
            timeframe: step.timeframe || 'Today',
            completed: Boolean(step.completed),
          }))
        : undefined,
      moodTag: parsed.moodTag || (mode === 'action_steps' ? 'Action-Oriented' : 'Reflective'),
      sentimentScore: typeof parsed.sentimentScore === 'number' ? parsed.sentimentScore : 7.0,
      insights: Array.isArray(parsed.insights) ? parsed.insights : undefined,
      growthPrompt: parsed.growthPrompt || undefined,
    };
  } catch (err) {
    console.error('Gemini chat feedback error:', err);
    return generateFallbackChatFeedback(userMessage, mode);
  }
}

function generateFallbackChatFeedback(userMessage: string, mode: ReflectionMode) {
  const isOverwhelmed = /overwhelm|too much|stress|busy|tired|anxious|lost|stuck|hard/i.test(userMessage);

  if (mode === 'action_steps') {
    return {
      content: `I hear the weight in what you're carrying. When everything feels like it needs attention all at once, the secret is refusing to juggle it in your head. Let's break this down into clear, small, manageable steps so you can regain momentum one thing at a time:`,
      actionSteps: [
        {
          id: `step_${Date.now()}_1`,
          task: 'Brain-dump all pending items on a scratchpad and pick ONLY the single top priority for right now.',
          timeframe: 'Next 10 mins',
          completed: false,
        },
        {
          id: `step_${Date.now()}_2`,
          task: 'Execute a single 20-minute focused sprint on that priority without checking tabs or notifications.',
          timeframe: 'Today',
          completed: false,
        },
        {
          id: `step_${Date.now()}_3`,
          task: 'De-escalate or reschedule non-critical tasks that do not impact your primary outcome.',
          timeframe: 'Today',
          completed: false,
        },
        {
          id: `step_${Date.now()}_4`,
          task: 'Give yourself permission to pause and take a 10-minute walk to reset mental fatigue.',
          timeframe: 'Evening',
          completed: false,
        },
      ],
      moodTag: isOverwhelmed ? 'Overwhelmed → Action' : 'Organized & Focused',
      sentimentScore: isOverwhelmed ? 6.2 : 7.8,
      insights: [
        'Overwhelm is usually a signal of trying to decide while acting; separate the planning phase from the execution phase.',
        'Completing one small action breaks inertia faster than waiting for perfect clarity.',
      ],
      growthPrompt: 'Which single item on this list, if done right now, would relieve the most mental pressure?',
    };
  }

  if (mode === 'socratic') {
    return {
      content: `Thank you for putting this into words. Often what feels like an insurmountable obstacle on the surface is pointing toward a deeper priority or unspoken fear. Let us look beneath the surface:`,
      actionSteps: [
        {
          id: `step_${Date.now()}_1`,
          task: 'Write down your raw answer to the question below without editing yourself.',
          timeframe: 'Next 5 mins',
          completed: false,
        },
      ],
      moodTag: 'Inquisitive & Thoughtful',
      sentimentScore: 7.0,
      insights: [
        'Notice if you are holding yourself to an unspoken standard of perfection.',
        'Unpacking the worst-case scenario often shows that reality is far more manageable than anticipated.',
      ],
      growthPrompt: 'What assumption are you making about this situation that might not actually be true?',
    };
  }

  // Default balanced / reflection
  return {
    content: `It takes honesty to express what you just wrote. Giving words to your experience allows your nervous system to step back and observe rather than stay entangled. Remember that you do not have to solve every dimension of this immediately; progress is built through small, steady commitments.`,
    actionSteps: [
      {
        id: `step_${Date.now()}_1`,
        task: 'Identify the one tangible boundary or step you can take today.',
        timeframe: 'Today',
        completed: false,
      },
      {
        id: `step_${Date.now()}_2`,
        task: 'Acknowledge your effort and give yourself credit for confronting this directly.',
        timeframe: 'Tonight',
        completed: false,
      },
    ],
    moodTag: isOverwhelmed ? 'Calming & Re-centering' : 'Reflective & Grounded',
    sentimentScore: 7.4,
    insights: [
      'Self-awareness isn\'t self-criticism; it is the space where intentional choices become possible.',
      'Action creates clarity; clarity rarely arrives purely through thinking.',
    ],
    growthPrompt: 'What kind of support or environment would make navigating this feel 10% easier right now?',
  };
}

