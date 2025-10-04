import { ClaudeService, type DetectedActionItem, type MeetingAnalysis } from './claude';
import { logger } from '../config/logger';

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
  async analyzeMeeting(transcript: string): Promise<{
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
        'Automatic analysis of meeting transcription'
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
  async detectActionItems(transcript: string): Promise<Array<{
    description: string;
    assignee: string | null;
    priority: 'low' | 'medium' | 'high';
  }>> {
    try {
      // Parse transcript into transcription objects
      const transcriptions = this.parseTranscript(transcript);

      // Call Claude service
      const actionItems: DetectedActionItem[] = await this.claudeService.detectActionItems(transcriptions);

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
  async detectTopics(transcript: string): Promise<string[]> {
    try {
      const response = await this.claudeService.chat([{
        role: 'user',
        content: `Analiza la siguiente transcripción de reunión y extrae los 5 temas principales discutidos.
Responde solo con una lista de temas separados por comas, sin numeración ni explicaciones.

Transcripción:
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
  async analyzeSentiment(transcript: string): Promise<'positive' | 'neutral' | 'negative'> {
    try {
      const response = await this.claudeService.chat([{
        role: 'user',
        content: `Analiza el tono general de la siguiente transcripción de reunión.
Responde solo con una palabra: "positive", "neutral", o "negative".

Transcripción:
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
  async askQuestion(question: string, context: string): Promise<string> {
    try {
      const response = await this.claudeService.chat([{
        role: 'user',
        content: `Eres un asistente de IA especializado en analizar reuniones.
Basándote en el contexto proporcionado (transcripciones y documentos), responde la siguiente pregunta de manera concisa y precisa.

Contexto:
${context}

Pregunta: ${question}

Respuesta:`
      }]);

      return response.trim();
    } catch (error: any) {
      logger.error('Failed to answer question:', error);
      throw new Error(`Failed to answer question: ${error.message}`);
    }
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
}

// Export singleton
export const aiService = new AIService();
