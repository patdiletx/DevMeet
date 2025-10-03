import { logger } from '../config/logger';
import { whisperService } from './whisper';
import { claudeService } from './claude';
import { wsService } from './websocket';
import { TranscriptionModel } from '../models';
import type { WSMessageType } from '../types/websocket';

/**
 * Audio chunk for processing
 */
interface AudioChunk {
  meetingId: number;
  clientId: string;
  chunk: string; // Base64 encoded
  sequence: number;
  format: string;
  timestamp: Date;
}

/**
 * Buffered audio data
 */
interface AudioBuffer {
  chunks: AudioChunk[];
  lastProcessed: Date;
  totalChunks: number;
}

/**
 * Service for processing audio chunks and generating transcriptions
 */
export class AudioProcessorService {
  private buffers: Map<number, AudioBuffer> = new Map();
  private processingInterval: NodeJS.Timeout | null = null;
  private config = {
    bufferDuration: 10000, // Process every 10 seconds
    minChunksToProcess: 5, // Minimum chunks before processing
    maxBufferSize: 50, // Maximum chunks to buffer
  };

  constructor() {
    this.startProcessing();
  }

  /**
   * Add audio chunk to buffer
   */
  addChunk(chunk: AudioChunk): void {
    let buffer = this.buffers.get(chunk.meetingId);

    if (!buffer) {
      buffer = {
        chunks: [],
        lastProcessed: new Date(),
        totalChunks: 0,
      };
      this.buffers.set(chunk.meetingId, buffer);
    }

    buffer.chunks.push(chunk);
    buffer.totalChunks++;

    logger.debug(
      `Audio chunk ${chunk.sequence} added to meeting ${chunk.meetingId} buffer (${buffer.chunks.length} chunks)`
    );

    // Process immediately if buffer is full
    if (buffer.chunks.length >= this.config.maxBufferSize) {
      logger.info(`Buffer full for meeting ${chunk.meetingId}, processing immediately`);
      this.processBuffer(chunk.meetingId);
    }
  }

  /**
   * Start background processing
   */
  private startProcessing(): void {
    this.processingInterval = setInterval(() => {
      this.processAllBuffers();
    }, this.config.bufferDuration);

    logger.info('Audio processor started');
  }

  /**
   * Process all buffers
   */
  private async processAllBuffers(): Promise<void> {
    for (const [meetingId, buffer] of this.buffers.entries()) {
      const timeSinceLastProcess = Date.now() - buffer.lastProcessed.getTime();

      // Process if enough chunks or enough time has passed
      if (
        buffer.chunks.length >= this.config.minChunksToProcess ||
        timeSinceLastProcess >= this.config.bufferDuration
      ) {
        await this.processBuffer(meetingId);
      }
    }
  }

  /**
   * Process buffered audio for a meeting
   */
  private async processBuffer(meetingId: number): Promise<void> {
    const buffer = this.buffers.get(meetingId);
    if (!buffer || buffer.chunks.length === 0) {
      return;
    }

    logger.info(`Processing ${buffer.chunks.length} audio chunks for meeting ${meetingId}`);

    // Get chunks to process and clear buffer
    const chunksToProcess = [...buffer.chunks];
    buffer.chunks = [];
    buffer.lastProcessed = new Date();

    try {
      // Check if Whisper is configured
      if (!whisperService.isConfigured()) {
        logger.warn('Whisper not configured, skipping transcription');
        return;
      }

      // Combine chunks into single audio buffer
      const combinedAudio = this.combineAudioChunks(chunksToProcess);

      // Get client ID for sending responses
      const clientId = chunksToProcess[0]?.clientId;

      // Transcribe with Whisper
      const transcription = await whisperService.transcribeBase64(
        combinedAudio,
        chunksToProcess[0]?.format || 'webm',
        {
          language: 'es',
          prompt: 'Reunión técnica de desarrolladores. Términos técnicos y código.',
        }
      );

      if (!transcription.text || transcription.text.trim().length === 0) {
        logger.warn('Empty transcription received, skipping');
        return;
      }

      // Save to database
      const dbTranscription = await TranscriptionModel.create({
        meeting_id: meetingId,
        content: transcription.text,
        timestamp: new Date(),
        language: transcription.language || 'es',
        confidence: 0.9, // Whisper doesn't provide confidence, use default
        metadata: {
          chunks_processed: chunksToProcess.length,
          duration: transcription.duration,
        },
      });

      logger.info(`Transcription saved: ${dbTranscription.id} for meeting ${meetingId}`);

      // Send transcription to client via WebSocket
      if (clientId) {
        wsService.sendTranscription(clientId, dbTranscription);
      }

      // Optionally: Trigger Claude analysis for action items/notes
      // This could be done every N transcriptions or on-demand
      await this.triggerAnalysisIfNeeded(meetingId);
    } catch (error) {
      logger.error(`Error processing audio for meeting ${meetingId}:`, error);

      // Send error to client
      if (chunksToProcess[0]?.clientId) {
        // TODO: Send error via WebSocket
      }
    }
  }

  /**
   * Combine multiple base64 audio chunks into one
   * Note: This is a simplified version. In production, you'd want proper audio merging
   */
  private combineAudioChunks(chunks: AudioChunk[]): string {
    // Sort by sequence number
    chunks.sort((a, b) => a.sequence - b.sequence);

    // For WebM and most formats, we can simply concatenate the base64
    // For production, consider using ffmpeg or similar for proper merging
    return chunks.map((c) => c.chunk).join('');
  }

  /**
   * Trigger Claude analysis if conditions are met
   */
  private async triggerAnalysisIfNeeded(meetingId: number): Promise<void> {
    try {
      if (!claudeService.isConfigured()) {
        return;
      }

      // Get recent transcriptions
      const transcriptions = await TranscriptionModel.findByMeetingId(meetingId, {
        limit: 10,
        offset: 0,
      });

      // Only analyze if we have enough content
      if (transcriptions.length < 5) {
        return;
      }

      // Check if we should analyze (e.g., every 10 transcriptions)
      const totalTranscriptions = transcriptions.length;
      if (totalTranscriptions % 10 !== 0) {
        return;
      }

      logger.info(`Triggering Claude analysis for meeting ${meetingId}`);

      // Detect action items
      const actionItems = await claudeService.detectActionItems(transcriptions);

      logger.info(`Detected ${actionItems.length} action items for meeting ${meetingId}`);

      // TODO: Save action items to database
      // TODO: Send action items to clients via WebSocket

      // Broadcast to all clients in this meeting
      for (const item of actionItems) {
        wsService.broadcastToMeeting(meetingId, {
          type: 'action_item' as WSMessageType,
          timestamp: new Date().toISOString(),
          data: {
            meetingId,
            actionItemId: 0, // TODO: Use real ID after saving to DB
            description: item.description,
            assignedTo: item.assignedTo,
            priority: item.priority,
          },
        });
      }
    } catch (error) {
      logger.error(`Error triggering analysis for meeting ${meetingId}:`, error);
    }
  }

  /**
   * Clear buffer for a meeting (call when meeting ends)
   */
  clearBuffer(meetingId: number): void {
    const buffer = this.buffers.get(meetingId);
    if (buffer) {
      logger.info(`Clearing buffer for meeting ${meetingId} (${buffer.totalChunks} total chunks processed)`);
      this.buffers.delete(meetingId);
    }
  }

  /**
   * Get buffer statistics
   */
  getStats(): Record<number, { chunksInBuffer: number; totalProcessed: number }> {
    const stats: Record<number, { chunksInBuffer: number; totalProcessed: number }> = {};

    for (const [meetingId, buffer] of this.buffers.entries()) {
      stats[meetingId] = {
        chunksInBuffer: buffer.chunks.length,
        totalProcessed: buffer.totalChunks,
      };
    }

    return stats;
  }

  /**
   * Shutdown processor
   */
  shutdown(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    // Process remaining buffers
    this.processAllBuffers();

    logger.info('Audio processor shut down');
  }
}

// Singleton instance
export const audioProcessor = new AudioProcessorService();
