import { AssemblyAI } from 'assemblyai';
import { logger } from '../config/logger';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export interface AssemblyAITranscriptionResult {
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
}

class AssemblyAIService {
  private client: AssemblyAI;
  private isInitialized: boolean = false;

  constructor() {
    const apiKey = process.env.ASSEMBLYAI_API_KEY || 'f438b61c8adb49539dc1edcf72ffa9d5';
    this.client = new AssemblyAI({
      apiKey,
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (!process.env.ASSEMBLYAI_API_KEY && !this.client) {
      throw new Error('ASSEMBLYAI_API_KEY environment variable is not set');
    }

    logger.info('AssemblyAI service initialized');
    this.isInitialized = true;
  }

  /**
   * Detect audio format from buffer signature
   */
  private detectAudioFormat(buffer: Buffer): string {
    // Check WebM signature (0x1A45DFA3)
    if (buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3) {
      return 'webm';
    }

    // Check OGG signature (OggS)
    if (buffer[0] === 0x4F && buffer[1] === 0x67 && buffer[2] === 0x67 && buffer[3] === 0x53) {
      return 'ogg';
    }

    // Check WAV signature (RIFF...WAVE)
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
      return 'wav';
    }

    // Check MP3 signature (ID3 or 0xFF 0xFB)
    if ((buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) ||
        (buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0)) {
      return 'mp3';
    }

    // Default to webm if unknown
    logger.warn(`Unknown audio format, defaulting to webm. First bytes: ${buffer.slice(0, 20).toString('hex')}`);
    return 'webm';
  }

  /**
   * Transcribe audio buffer using AssemblyAI
   */
  async transcribeAudio(
    audioBuffer: Buffer,
    filename: string,
    options: TranscriptionOptions = {}
  ): Promise<AssemblyAITranscriptionResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      logger.info(`Transcribing audio with AssemblyAI: ${filename} (${audioBuffer.length} bytes)`);

      // Detect audio format from buffer signature
      const detectedFormat = this.detectAudioFormat(audioBuffer);
      logger.info(`Detected audio format: ${detectedFormat}`);

      // Create temp file with correct extension
      const tempFilePath = join(tmpdir(), `devmeet_${Date.now()}.${detectedFormat}`);

      // Log the first few bytes to debug
      logger.debug(`Audio buffer first bytes: ${audioBuffer.slice(0, 20).toString('hex')}`);

      writeFileSync(tempFilePath, audioBuffer);
      logger.info(`Saved audio to temp file: ${tempFilePath}`);

      try {
        const startTime = Date.now();

        // Upload and transcribe
        const transcript = await this.client.transcripts.transcribe({
          audio: tempFilePath,
          language_code: options.language as any || 'es',
          // Enable speaker diarization for meeting context
          speaker_labels: true,
        });

        const processingTime = Date.now() - startTime;
        logger.info(`AssemblyAI processing took ${processingTime}ms`);

        // Clean up temp file
        unlinkSync(tempFilePath);

        if (transcript.status === 'error') {
          throw new Error(transcript.error || 'Transcription failed');
        }

        logger.info(`AssemblyAI transcription completed: ${transcript.text?.substring(0, 100)}...`);

        // Convert AssemblyAI format to our format
        const segments = transcript.words?.map((word, idx) => ({
          id: idx,
          start: word.start / 1000, // Convert ms to seconds
          end: word.end / 1000,
          text: word.text,
        })) || [];

        return {
          text: transcript.text || '',
          language: transcript.language_code,
          duration: transcript.audio_duration || undefined,
          segments,
        };
      } catch (error) {
        // Clean up temp file on error
        try {
          unlinkSync(tempFilePath);
        } catch {}
        throw error;
      }
    } catch (error: any) {
      logger.error('AssemblyAI transcription failed:', error);
      throw new Error(`AssemblyAI transcription failed: ${error.message}`);
    }
  }

  /**
   * Transcribe audio chunk in real-time
   */
  async transcribeChunk(
    audioChunk: Buffer,
    chunkIndex: number,
    meetingContext?: string
  ): Promise<AssemblyAITranscriptionResult> {
    const filename = `chunk_${chunkIndex}.webm`;

    return this.transcribeAudio(audioChunk, filename, {
      prompt: meetingContext,
      temperature: 0.2,
    });
  }

  /**
   * Build context string from previous transcriptions
   */
  buildContext(previousTranscriptions: string[], maxLength: number = 500): string {
    const recentTranscriptions = previousTranscriptions.slice(-3);
    const context = recentTranscriptions.join(' ');

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

    // Check maximum size (reasonable limit)
    if (buffer.length > 100 * 1024 * 1024) {
      logger.warn('Audio buffer exceeds 100MB limit');
      return false;
    }

    return true;
  }

  /**
   * Clean up and shutdown service
   */
  async shutdown(): Promise<void> {
    logger.info('AssemblyAI service shutting down');
    this.isInitialized = false;
  }
}

// Export singleton instance
export const assemblyaiService = new AssemblyAIService();
