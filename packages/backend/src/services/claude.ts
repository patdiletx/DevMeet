import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../config/logger';
import type { Transcription } from '../types';

/**
 * Claude API configuration
 */
interface ClaudeConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Note generation result
 */
export interface GeneratedNote {
  content: string;
  type: 'summary' | 'key_point' | 'decision' | 'question' | 'insight';
  section?: string;
  confidence?: number;
}

/**
 * Action item detection result
 */
export interface DetectedActionItem {
  description: string;
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  context?: string;
}

/**
 * Documentation reference suggestion
 */
export interface DocumentationSuggestion {
  technology: string;
  url: string;
  title: string;
  description: string;
  relevanceScore: number;
}

/**
 * Analysis result from Claude
 */
export interface MeetingAnalysis {
  notes: GeneratedNote[];
  actionItems: DetectedActionItem[];
  documentationSuggestions: DocumentationSuggestion[];
  summary: string;
  keyDecisions: string[];
  participants?: Array<{ name: string; role?: string }>;
}

/**
 * Service for interacting with Anthropic Claude API
 */
export class ClaudeService {
  private client: Anthropic | null = null;
  private config: ClaudeConfig;

  constructor(config: ClaudeConfig) {
    this.config = {
      model: 'claude-3-5-sonnet-20241022',
      maxTokens: 4096,
      temperature: 0.3,
      maxRetries: 3,
      retryDelay: 1000,
      ...config,
    };

    if (!this.config.apiKey || this.config.apiKey.startsWith('sk-ant-api03-PLACEHOLDER')) {
      logger.warn('Claude API key not configured. AI features will not work.');
    } else {
      this.client = new Anthropic({
        apiKey: this.config.apiKey,
      });
    }
  }

  /**
   * Analyze meeting transcriptions and generate notes, action items, etc.
   */
  async analyzeMeeting(
    transcriptions: Transcription[],
    meetingTitle: string,
    meetingDescription?: string
  ): Promise<MeetingAnalysis> {
    if (!this.client) {
      throw new Error('Claude API key not configured');
    }

    const transcriptText = this.formatTranscriptions(transcriptions);

    const prompt = `You are an AI assistant helping developers during technical meetings. Analyze the following meeting transcription and provide:

1. **Summary**: A brief overview of the meeting (2-3 sentences)
2. **Key Points**: Important technical points discussed
3. **Decisions**: Key decisions made during the meeting
4. **Action Items**: Tasks that need to be done, with assigned person if mentioned
5. **Documentation Suggestions**: Links to relevant technical documentation based on technologies/topics mentioned

Meeting: ${meetingTitle}
${meetingDescription ? `Description: ${meetingDescription}` : ''}

Transcription:
${transcriptText}

Please respond in JSON format with the following structure:
{
  "summary": "Brief meeting summary",
  "keyPoints": ["point 1", "point 2", ...],
  "decisions": ["decision 1", "decision 2", ...],
  "actionItems": [
    {
      "description": "Task description",
      "assignedTo": "Person name (if mentioned)",
      "priority": "low|medium|high|urgent",
      "context": "Brief context"
    }
  ],
  "documentationSuggestions": [
    {
      "technology": "Technology name",
      "url": "Official documentation URL",
      "title": "Documentation title",
      "description": "Why this is relevant",
      "relevanceScore": 0.0-1.0
    }
  ],
  "participants": [
    {"name": "Person name", "role": "Their role (if mentioned)"}
  ]
}`;

    return this.executeWithRetry(async () => {
      const startTime = Date.now();

      try {
        const response = await this.client!.messages.create({
          model: this.config.model!,
          max_tokens: this.config.maxTokens!,
          temperature: this.config.temperature!,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        });

        const duration = Date.now() - startTime;
        logger.info(`Claude analysis completed in ${duration}ms`);

        // Parse Claude's response
        const content = response.content[0];
        if (content.type !== 'text') {
          throw new Error('Unexpected response type from Claude');
        }

        const result = this.parseAnalysisResponse(content.text);
        return result;
      } catch (error) {
        logger.error('Claude API error:', error);
        throw error;
      }
    });
  }

  /**
   * Generate a single note from a transcription segment
   */
  async generateNote(transcription: Transcription): Promise<GeneratedNote> {
    if (!this.client) {
      throw new Error('Claude API key not configured');
    }

    const prompt = `Analyze this meeting transcription segment and generate a concise note:

Speaker: ${transcription.speaker || 'Unknown'}
Content: ${transcription.content}

Respond in JSON format:
{
  "content": "The note content",
  "type": "summary|key_point|decision|question|insight",
  "section": "Optional section/topic name",
  "confidence": 0.0-1.0
}`;

    return this.executeWithRetry(async () => {
      const response = await this.client!.messages.create({
        model: this.config.model!,
        max_tokens: 500,
        temperature: this.config.temperature!,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      return JSON.parse(content.text);
    });
  }

  /**
   * Detect action items from recent transcriptions
   */
  async detectActionItems(transcriptions: Transcription[]): Promise<DetectedActionItem[]> {
    if (!this.client) {
      throw new Error('Claude API key not configured');
    }

    const transcriptText = this.formatTranscriptions(transcriptions);

    const prompt = `Analyze this meeting transcription and identify action items (tasks, TODOs, assignments):

${transcriptText}

Respond in JSON format as an array:
[
  {
    "description": "Task description",
    "assignedTo": "Person name (if mentioned, otherwise null)",
    "priority": "low|medium|high|urgent",
    "context": "Brief context about why this is needed"
  }
]`;

    return this.executeWithRetry(async () => {
      const response = await this.client!.messages.create({
        model: this.config.model!,
        max_tokens: 1024,
        temperature: this.config.temperature!,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      return JSON.parse(content.text);
    });
  }

  /**
   * Find relevant documentation based on technologies mentioned
   */
  async findDocumentation(transcriptions: Transcription[]): Promise<DocumentationSuggestion[]> {
    if (!this.client) {
      throw new Error('Claude API key not configured');
    }

    const transcriptText = this.formatTranscriptions(transcriptions);

    const prompt = `Analyze this technical meeting transcription and identify technologies/frameworks mentioned.
Suggest relevant official documentation links:

${transcriptText}

Respond in JSON format as an array:
[
  {
    "technology": "Technology name",
    "url": "Official documentation URL",
    "title": "Documentation page title",
    "description": "Why this is relevant to the discussion",
    "relevanceScore": 0.0-1.0
  }
]

Only suggest official documentation from trusted sources (official docs, GitHub repos, MDN, etc.)`;

    return this.executeWithRetry(async () => {
      const response = await this.client!.messages.create({
        model: this.config.model!,
        max_tokens: 2048,
        temperature: this.config.temperature!,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      return JSON.parse(content.text);
    });
  }

  /**
   * Format transcriptions for Claude
   */
  private formatTranscriptions(transcriptions: Transcription[]): string {
    return transcriptions
      .map((t) => {
        const timestamp = t.timestamp.toISOString();
        const speaker = t.speaker || 'Unknown';
        return `[${timestamp}] ${speaker}: ${t.content}`;
      })
      .join('\n');
  }

  /**
   * Parse Claude's analysis response
   */
  private parseAnalysisResponse(text: string): MeetingAnalysis {
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;

      const parsed = JSON.parse(jsonText);

      return {
        summary: parsed.summary || '',
        notes: (parsed.keyPoints || []).map((point: string) => ({
          content: point,
          type: 'key_point' as const,
        })),
        actionItems: parsed.actionItems || [],
        documentationSuggestions: parsed.documentationSuggestions || [],
        keyDecisions: parsed.decisions || [],
        participants: parsed.participants || [],
      };
    } catch (error) {
      logger.error('Failed to parse Claude response:', error);
      throw new Error('Failed to parse AI response');
    }
  }

  /**
   * Execute function with retry logic
   */
  private async executeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries!; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on authentication errors
        if (
          lastError.message.includes('authentication') ||
          lastError.message.includes('API key')
        ) {
          throw lastError;
        }

        if (attempt < this.config.maxRetries!) {
          const delay = this.config.retryDelay! * attempt;
          logger.warn(`Claude API attempt ${attempt} failed, retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Claude API request failed');
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.client;
  }
}

// Singleton instance
const apiKey = process.env.ANTHROPIC_API_KEY || '';
export const claudeService = new ClaudeService({ apiKey });
