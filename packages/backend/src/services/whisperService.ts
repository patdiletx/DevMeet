import OpenAI from 'openai';
import { logger } from '../config/logger';

export interface WhisperTranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
  segments?: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
  }>;
}

export interface TranscriptionOptions {
  language?: string;
  prompt?: string;
  temperature?: number;
  model?: 'whisper-1';
}

class WhisperService {
  private client: OpenAI;
  private isInitialized: boolean = false;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    logger.info('Whisper service initialized');
    this.isInitialized = true;
  }

  /**
   * Transcribe audio buffer using OpenAI Whisper API
   * @param audioBuffer Audio data as Buffer
   * @param filename Original filename (used for format detection)
   * @param options Transcription options
   */
  async transcribeAudio(
    audioBuffer: Buffer,
    filename: string,
    options: TranscriptionOptions = {}
  ): Promise<WhisperTranscriptionResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      logger.info(`Transcribing audio: ${filename} (${audioBuffer.length} bytes)`);

      // Create a File-like object from the buffer
      const file = new File([audioBuffer], filename, {
        type: this.getMimeType(filename),
      });

      // Call Whisper API
      const transcription = await this.client.audio.transcriptions.create({
        file: file,
        model: options.model || 'whisper-1',
        language: options.language,
        prompt: options.prompt,
        temperature: options.temperature || 0,
        response_format: 'verbose_json', // Get detailed response with timestamps
      });

      logger.info(`Transcription completed: ${transcription.text.substring(0, 100)}...`);

      return {
        text: transcription.text,
        language: transcription.language,
        duration: transcription.duration,
        segments: transcription.segments as any,
      };
    } catch (error: any) {
      logger.error('Whisper transcription failed:', error);
      throw new Error(`Whisper transcription failed: ${error.message}`);
    }
  }

  /**
   * Transcribe audio chunk in real-time
   * This is optimized for streaming audio chunks
   */
  async transcribeChunk(
    audioChunk: Buffer,
    chunkIndex: number,
    meetingContext?: string
  ): Promise<WhisperTranscriptionResult> {
    const filename = `chunk_${chunkIndex}.webm`;

    return this.transcribeAudio(audioChunk, filename, {
      prompt: meetingContext, // Use previous context for better accuracy
      temperature: 0.2, // Slightly higher for real-time to handle unclear audio
    });
  }

  /**
   * Get MIME type from filename extension
   */
  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();

    const mimeTypes: Record<string, string> = {
      'mp3': 'audio/mpeg',
      'mp4': 'audio/mp4',
      'm4a': 'audio/mp4',
      'wav': 'audio/wav',
      'webm': 'audio/webm',
      'ogg': 'audio/ogg',
      'flac': 'audio/flac',
    };

    return mimeTypes[ext || ''] || 'audio/webm';
  }

  /**
   * Build context string from previous transcriptions
   * This helps Whisper maintain consistency across chunks
   */
  buildContext(previousTranscriptions: string[], maxLength: number = 224): string {
    // Whisper prompt is limited to 224 tokens
    const recentTranscriptions = previousTranscriptions.slice(-3); // Last 3 transcriptions
    const context = recentTranscriptions.join(' ');

    // Truncate if too long
    return context.length > maxLength
      ? context.substring(context.length - maxLength)
      : context;
  }

  /**
   * Validate audio buffer
   */
  isValidAudioBuffer(buffer: Buffer): boolean {
    // Check minimum size (at least 1KB)
    if (buffer.length < 1024) {
      logger.warn('Audio buffer too small');
      return false;
    }

    // Check maximum size (25MB - Whisper API limit)
    if (buffer.length > 25 * 1024 * 1024) {
      logger.warn('Audio buffer exceeds 25MB limit');
      return false;
    }

    return true;
  }

  /**
   * Clean up and shutdown service
   */
  async shutdown(): Promise<void> {
    logger.info('Whisper service shutting down');
    this.isInitialized = false;
  }
}

// Export singleton instance
export const whisperService = new WhisperService();
