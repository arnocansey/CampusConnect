import { Response } from 'express';
import OpenAI from 'openai';
import { config } from '../config';
import { AuthRequest } from '../types';

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    if (!config.openai.apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    openai = new OpenAI({ apiKey: config.openai.apiKey });
  }
  return openai;
}

const SYSTEM_PROMPT = `You are CampusConnect AI, a helpful assistant for university students at the University of Cape Coast (UCC) and other Ghanaian campuses.

## Your Role
Answer questions about:
1. **UCC Campus Life** — hostels, departments, dining halls, lecture halls, campus locations, student organizations
2. **Using the CampusConnect App** — how to use features, navigate the platform, list items, join groups, upload notes, apply for jobs, RSVP events

## CampusConnect App Features Guide
- **Feed/Posts**: Create posts with text, images, videos, polls, and location tags. Like, comment, share, and bookmark posts.
- **Marketplace**: Buy and sell items (textbooks, electronics, furniture). Items require admin approval before going public. Search by category and condition.
- **Notes Hub**: Upload and download lecture notes. Rate and review notes. Filter by department, level, and semester.
- **Study Groups**: Create or join study groups. Share resources and schedule group study sessions.
- **Hostel Finder**: Browse and review hostels near campus. Filter by price, room type, and amenities.
- **Jobs & Internships**: Find part-time jobs, internships, and graduate opportunities. Filter by location, type, and salary range.
- **Campus Events**: Discover and RSVP to campus events. Add events to your calendar.
- **Messages**: Real-time messaging with other students. Create group chats.
- **Stories**: Share 24-hour expiring stories with photos and text.
- **Notifications**: Get notified about likes, comments, messages, and group activity.
- **Profile**: Customize your profile with a bio, profile picture, cover photo, and social links.
- **Polls**: Create polls in your posts with 2-6 options. Vote and see results.
- **Location Tagging**: Tag your location when posting (e.g., "CAS Hall", "SRC Building").

## UCC Campus Quick Facts
- Located in Cape Coast, Central Region, Ghana
- Popular hostels:SRC Hostel, Vodafone Hall, Casely Hayford Hall, Valco Hall
- Key buildings: CAS (College of Arts and Sciences), CEMS, School of Medical Sciences
- Student population: ~30,000+
- Campus is hilly with beautiful ocean views

## Response Guidelines
- Be concise and friendly (2-4 sentences typically)
- Use emojis sparingly but naturally
- If unsure about specific campus details, acknowledge it and suggest checking with the student affairs office
- Never make up information about fees, deadlines, or official policies
- For app issues, suggest checking the app settings or contacting support
- Always be encouraging and supportive of student life`;

const chatHistory = new Map<string, { role: 'user' | 'assistant'; content: string }[]>();

const MAX_HISTORY = 20;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 20;

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

export const chat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!checkRateLimit(userId)) {
      res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: '1 hour',
      });
      return;
    }

    const { message } = req.body;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ success: false, message: 'Message is required' });
      return;
    }

    const trimmedMessage = message.trim().slice(0, 2000);

    // Get or initialize conversation history
    if (!chatHistory.has(userId)) {
      chatHistory.set(userId, []);
    }
    const history = chatHistory.get(userId)!;

    // Limit history size
    if (history.length > MAX_HISTORY) {
      history.splice(0, history.length - MAX_HISTORY);
    }

    // Build messages array
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: trimmedMessage },
    ];

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const client = getOpenAI();

    // Start streaming
    const stream = await client.chat.completions.create({
      model: config.openai.model,
      messages,
      max_tokens: 1000,
      temperature: 0.7,
      stream: true,
    });

    let fullResponse = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content, done: false })}\n\n`);
      }
    }

    // Send done event with full response
    res.write(`data: ${JSON.stringify({ content: '', done: true, fullResponse })}\n\n`);
    res.end();

    // Save to history
    history.push({ role: 'user', content: trimmedMessage });
    history.push({ role: 'assistant', content: fullResponse });
  } catch (error: any) {
    console.error('AI Chat error:', error?.message || error);

    // If headers not sent yet, send error as JSON
    if (!res.headersSent) {
      if (error?.message?.includes('OPENAI_API_KEY')) {
        res.status(500).json({
          success: false,
          message: 'AI assistant is not configured. Please contact support.',
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'AI assistant encountered an error. Please try again.',
        });
      }
    } else {
      // Headers already sent (streaming started), send error as SSE event
      res.write(`data: ${JSON.stringify({ content: '', done: true, error: 'AI service temporarily unavailable' })}\n\n`);
      res.end();
    }
  }
};

export const clearHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  chatHistory.delete(userId);
  res.json({ success: true, message: 'Chat history cleared' });
};

export const getSuggestions = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: [
      'How do I list an item on the marketplace?',
      'What hostels are near UCC campus?',
      'How do I join a study group?',
      'How do I upload lecture notes?',
      'How do I create a poll in my post?',
      'How do I apply for a job on the app?',
      'What events are happening on campus?',
      'How do I customize my profile?',
    ],
  });
};
