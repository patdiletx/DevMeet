import axios from 'axios';
import FormData from 'form-data';
import { logger } from '../config/logger';

/**
 * Whisper API configuration
 */
interface WhisperConfig {
  apiKey: string;
  model?: string;
  language?: string;
  temperature?: number;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Whisper transcription result
 */
export interface WhisperTranscription {
  text: string;
  language?: string;
  duration?: number;
  segments?: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
    tokens: number[];
    temperature: number;
    avg_logprob: number;
    compression_ratio: number;
    no_speech_prob: number;
  }>;
}

/**
 * Audio transcription options
 */
export interface TranscriptionOptions {
  language?: string; // ISO-639-1 language code (e.g., 'es', 'en')
  prompt?: string; // Optional context for the model
  temperature?: number; // 0-1, controls randomness
  responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
}

/**
 * Service for interacting with OpenAI Whisper API
 */
export class WhisperService {
  private config: WhisperConfig;
  private baseURL = 'https://api.openai.com/v1/audio';

  constructor(config: WhisperConfig) {
    this.config = {
      model: 'whisper-1',
      language: 'es', // Default to Spanish
      temperature: 0.2,
      maxRetries: 3,
      retryDelay: 1000,
      ...config,
    };

    if (!this.config.apiKey || this.config.apiKey.startsWith('sk-PLACEHOLDER')) {
      logger.warn('Whisper API key not configured. Transcription will not work.');
    }
  }

  /**
   * Transcribe audio buffer to text
   */
  async transcribe(
    audioBuffer: Buffer,
    filename: string,
    options: TranscriptionOptions = {}
  ): Promise<WhisperTranscription> {
    if (!this.config.apiKey || this.config.apiKey.startsWith('sk-PLACEHOLDER')) {
      throw new Error('Whisper API key not configured');
    }

    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: filename,
      contentType: this.getContentType(filename),
    });
    formData.append('model', this.config.model!);

    // Add optional parameters
    if (options.language || this.config.language) {
      formData.append('language', options.language || this.config.language!);
    }

    if (options.prompt) {
      formData.append('prompt', options.prompt);
    }

    if (options.temperature !== undefined) {
      formData.append('temperature', options.temperature.toString());
    } else if (this.config.temperature !== undefined) {
      formData.append('temperature', this.config.temperature.toString());
    }

    if (options.responseFormat) {
      formData.append('response_format', options.responseFormat);
    }

    return this.executeWithRetry(async () => {
      const startTime = Date.now();

      try {
        const response = await axios.post<WhisperTranscription>(
          `${this.baseURL}/transcriptions`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              Authorization: `Bearer ${this.config.apiKey}`,
            },
            timeout: 30000, // 30 seconds timeout
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
          }
        );

        const duration = Date.now() - startTime;
        logger.info(`Whisper transcription completed in ${duration}ms`);

        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          const message = error.response?.data?.error?.message || error.message;

          logger.error(`Whisper API error (${status}):`, message);

          if (status === 401) {
            throw new Error('Invalid Whisper API key');
          } else if (status === 429) {
            throw new Error('Whisper API rate limit exceeded');
          } else if (status === 413) {
            throw new Error('Audio file too large (max 25MB)');
          } else {
            throw new Error(`Whisper API error: ${message}`);
          }
        }

        throw error;
      }
    });
  }

  /**
   * Transcribe audio from base64 string
   */
  async transcribeBase64(
    base64Audio: string,
    format: string = 'webm',
    options: TranscriptionOptions = {}
  ): Promise<WhisperTranscription> {
    // Remove data URL prefix if present
    const base64Data = base64Audio.replace(/^data:audio\/[^;]+;base64,/, '');
    const audioBuffer = Buffer.from(base64Data, 'base64');
    const filename = `audio.${format}`;

    return this.transcribe(audioBuffer, filename, options);
  }

  /**
   * Translate audio to English (uses Whisper's translation endpoint)
   */
  async translate(audioBuffer: Buffer, filename: string): Promise<WhisperTranscription> {
    if (!this.config.apiKey || this.config.apiKey.startsWith('sk-PLACEHOLDER')) {
      throw new Error('Whisper API key not configured');
    }

    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: filename,
      contentType: this.getContentType(filename),
    });
    formData.append('model', this.config.model!);

    return this.executeWithRetry(async () => {
      const response = await axios.post<WhisperTranscription>(
        `${this.baseURL}/translations`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          timeout: 30000,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      return response.data;
    });
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
        if (lastError.message.includes('Invalid') || lastError.message.includes('401')) {
          throw lastError;
        }

        if (attempt < this.config.maxRetries!) {
          const delay = this.config.retryDelay! * attempt;
          logger.warn(`Whisper API attempt ${attempt} failed, retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Whisper API request failed');
  }

  /**
   * Get content type from filename
   */
  private getContentType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();

    const contentTypes: Record<string, string> = {
      mp3: 'audio/mpeg',
      mp4: 'audio/mp4',
      mpeg: 'audio/mpeg',
      mpga: 'audio/mpeg',
      m4a: 'audio/mp4',
      wav: 'audio/wav',
      webm: 'audio/webm',
      ogg: 'audio/ogg',
      flac: 'audio/flac',
    };

    return contentTypes[ext || ''] || 'audio/webm';
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Validate audio file size (Whisper has 25MB limit)
   */
  validateAudioSize(buffer: Buffer): boolean {
    const maxSize = 25 * 1024 * 1024; // 25MB
    return buffer.length <= maxSize;
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!(this.config.apiKey && !this.config.apiKey.startsWith('sk-PLACEHOLDER'));
  }
}

// Singleton instance
const apiKey = process.env.OPENAI_API_KEY || '';
export const whisperService = new WhisperService({ apiKey });
