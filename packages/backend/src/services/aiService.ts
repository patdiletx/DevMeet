import { ClaudeService, type DetectedActionItem, type MeetingAnalysis } from './claude';
import { logger } from '../config/logger';
import type { GitCommit } from '../models/DailySummaryModel';

/**
 * Wrapper for AI services (currently uses Claude)
 * This provides a simplified interface for the audio processing service
 */
class AIService {
  private claudeService: ClaudeService;

  constructor() {
    this.claudeService = new ClaudeService({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      model: 'claude-3-5-sonnet-20241022',
      maxTokens: 4096,
      temperature: 0.3,
    });
  }

  /**
   * Analyze meeting transcript and return summary and key decisions
   */
  async analyzeMeeting(transcript: string, language?: string): Promise<{
    summary: string;
    keyPoints: string[];
    decisions: string[];
  }> {
    try {
      // Parse transcript into transcription objects
      const transcriptions = this.parseTranscript(transcript);

      // Call Claude service
      const analysis: MeetingAnalysis = await this.claudeService.analyzeMeeting(
        transcriptions,
        'Meeting Analysis',
        'Automatic analysis of meeting transcription',
        language
      );

      return {
        summary: analysis.summary,
        keyPoints: analysis.notes.map(note => note.content),
        decisions: analysis.keyDecisions || [],
      };
    } catch (error: any) {
      logger.error('Failed to analyze meeting:', error);
      throw new Error(`Failed to analyze meeting: ${error.message}`);
    }
  }

  /**
   * Detect action items from transcript
   */
  async detectActionItems(transcript: string, language?: string): Promise<Array<{
    description: string;
    assignee: string | null;
    priority: 'low' | 'medium' | 'high';
  }>> {
    try {
      // Parse transcript into transcription objects
      const transcriptions = this.parseTranscript(transcript);

      // Call Claude service
      const actionItems: DetectedActionItem[] = await this.claudeService.detectActionItems(transcriptions, language);

      // Map to simplified format
      return actionItems.map(item => ({
        description: item.description,
        assignee: item.assignedTo || null,
        priority: item.priority === 'urgent' ? 'high' : item.priority as 'low' | 'medium' | 'high',
      }));
    } catch (error: any) {
      logger.error('Failed to detect action items:', error);
      throw new Error(`Failed to detect action items: ${error.message}`);
    }
  }

  /**
   * Detect main topics discussed in the meeting
   */
  async detectTopics(transcript: string, language?: string): Promise<string[]> {
    try {
      const languageInstructions = this.getLanguageInstructions(language);

      const response = await this.claudeService.chat([{
        role: 'user',
        content: `${languageInstructions}

Analyze the following meeting transcription and extract the 5 main topics discussed.
Respond only with a list of topics separated by commas, without numbering or explanations.

Transcription:
${transcript}`
      }]);

      // Parse topics from response
      const topics = response.split(',').map(t => t.trim()).filter(t => t.length > 0);
      return topics.slice(0, 5);
    } catch (error: any) {
      logger.error('Failed to detect topics:', error);
      return [];
    }
  }

  /**
   * Analyze sentiment of the meeting
   */
  async analyzeSentiment(transcript: string, language?: string): Promise<'positive' | 'neutral' | 'negative'> {
    try {
      const response = await this.claudeService.chat([{
        role: 'user',
        content: `Analyze the overall tone of the following meeting transcription.
Respond only with one word: "positive", "neutral", or "negative".

Transcription:
${transcript}`
      }]);

      const sentiment = response.trim().toLowerCase();
      if (sentiment.includes('positive')) return 'positive';
      if (sentiment.includes('negative')) return 'negative';
      return 'neutral';
    } catch (error: any) {
      logger.error('Failed to analyze sentiment:', error);
      return 'neutral';
    }
  }

  /**
   * Ask a question about the meeting with context
   */
  async askQuestion(question: string, context: string, language?: string): Promise<string> {
    try {
      const languageInstructions = this.getLanguageInstructions(language);

      const response = await this.claudeService.chat([{
        role: 'user',
        content: `${languageInstructions}

You are an AI assistant specialized in analyzing meetings.
Based on the provided context (transcriptions and documents), answer the following question concisely and accurately.

Context:
${context}

Question: ${question}

Answer:`
      }]);

      return response.trim();
    } catch (error: any) {
      logger.error('Failed to answer question:', error);
      throw new Error(`Failed to answer question: ${error.message}`);
    }
  }

  /**
   * Get language-specific instructions for AI prompts
   */
  private getLanguageInstructions(language?: string): string {
    if (!language) {
      return 'Please respond in Spanish.';
    }

    const languageMap: Record<string, string> = {
      'es': 'Por favor responde en español.',
      'en': 'Please respond in English.',
      'pt': 'Por favor, responda em português.',
      'fr': 'Veuillez répondre en français.',
      'de': 'Bitte antworten Sie auf Deutsch.',
      'it': 'Si prega di rispondere in italiano.',
    };

    return languageMap[language] || `Please respond in ${language}.`;
  }

  /**
   * Parse a transcript string into transcription objects
   * Expected format: "[timestamp] Speaker: Content"
   */
  private parseTranscript(transcript: string): any[] {
    const lines = transcript.split('\n').filter(line => line.trim().length > 0);

    return lines.map((line, index) => {
      // Parse format: "[2025-10-03 10:00] John: text..."
      const match = line.match(/\[(.*?)\]\s*([^:]+):\s*(.+)/);

      if (match) {
        const [, timestamp, speaker, content] = match;
        return {
          id: index + 1,
          meeting_id: 0,
          content: content.trim(),
          speaker: speaker.trim() || undefined,
          timestamp: new Date(timestamp),
          confidence: 0.9,
          start_time: 0,
          end_time: 0,
          language: null,
          metadata: {},
          created_at: new Date(),
        };
      }

      // Fallback: treat entire line as content
      return {
        id: index + 1,
        meeting_id: 0,
        content: line.trim(),
        speaker: undefined,
        timestamp: new Date(),
        confidence: 0.9,
        start_time: 0,
        end_time: 0,
        language: null,
        metadata: {},
        created_at: new Date(),
      };
    });
  }

  /**
   * Generate daily standup summary from git commits and meetings
   */
  async generateDailyStandup(data: {
    gitCommits: GitCommit[];
    meetingsSummary?: string;
    userNotes?: string;
    language?: string;
  }): Promise<{
    yesterday_work: string[];
    today_plan: string[];
    blockers: string[];
    standup_script: string;
  }> {
    try {
      const languageInstruction = this.getLanguageInstructions(data.language);

      const prompt = `${languageInstruction}

You are a helpful assistant that creates daily standup summaries for developers.

Based on the following information about yesterday's work, create a structured standup summary:

GIT COMMITS:
${data.gitCommits.length > 0 ? data.gitCommits.map(c => `- [${c.hash}] ${c.message} (${c.author})`).join('\n') : 'No commits found'}

${data.meetingsSummary ? `MEETINGS SUMMARY:\n${data.meetingsSummary}\n` : ''}

${data.userNotes ? `USER NOTES:\n${data.userNotes}\n` : ''}

Please provide:
1. A list of work items completed yesterday (bullet points, be specific about what was accomplished)
2. A list of planned tasks for today (infer from commits and context, be realistic)
3. Any blockers or issues (if mentioned in notes or can be inferred)
4. A natural standup script (2-3 sentences max, conversational tone for saying in a daily standup)

Format your response as JSON with this structure:
{
  "yesterday_work": ["item1", "item2", ...],
  "today_plan": ["task1", "task2", ...],
  "blockers": ["blocker1", ...] (empty array if none),
  "standup_script": "Natural text to say in standup"
}

IMPORTANT: Return ONLY the JSON object, no additional text or markdown formatting.`;

      const response = await this.claudeService.client.messages.create({
        model: this.claudeService.model || 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      // Parse JSON response
      const result = JSON.parse(content.text.trim());

      return {
        yesterday_work: result.yesterday_work || [],
        today_plan: result.today_plan || [],
        blockers: result.blockers || [],
        standup_script: result.standup_script || '',
      };
    } catch (error: any) {
      logger.error('Failed to generate daily standup:', error);
      throw new Error(`Failed to generate daily standup: ${error.message}`);
    }
  }
}

// Export singleton
export const aiService = new AIService();
