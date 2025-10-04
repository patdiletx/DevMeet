import { logger } from '../config/logger';
import { audioProcessingService } from './audioProcessingService';
import { wsService } from './websocket';

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
    bufferDuration: 2000, // Check buffer every 2 seconds
    minChunksToProcess: 1, // Process each chunk immediately (they're complete audio files)
    maxBufferSize: 5, // Maximum chunks to buffer before processing
  };

  constructor() {
    this.startProcessing();
    this.setupTranscriptionListener();
  }

  /**
   * Set up permanent listener for transcription events
   */
  private setupTranscriptionListener(): void {
    logger.info('Setting up transcription listener...');

    // Check if listener count to detect duplicates
    const listenerCount = audioProcessingService.listenerCount('transcription');
    if (listenerCount > 0) {
      logger.warn(`⚠️ Transcription listener already exists! Count: ${listenerCount}`);
      return; // Don't add another listener
    }

    audioProcessingService.on('transcription', (transcription: any) => {
      logger.info(`📝 AudioProcessor: Received transcription ID ${transcription.transcriptionId}: "${transcription.content.substring(0, 50)}..."`);

      // Get all clients connected to this meeting
      const meetingId = transcription.meetingId;
      const clients = wsService.getClientsByMeeting(meetingId);

      logger.info(`📤 AudioProcessor: Sending transcription ID ${transcription.transcriptionId} to ${clients.length} client(s) for meeting ${meetingId}`);

      // Send to all clients in the meeting
      clients.forEach((clientId, index) => {
        logger.info(`  → Sending to client ${index + 1}/${clients.length}: ${clientId}`);
        wsService.sendTranscription(clientId, {
          id: transcription.transcriptionId,
          meeting_id: transcription.meetingId,
          content: transcription.content,
          speaker: transcription.speaker,
          timestamp: transcription.timestamp,
          confidence: transcription.confidence,
        });
      });
    });

    logger.info(`Transcription listener set up. Total listeners: ${audioProcessingService.listenerCount('transcription')}`);
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

      // Initialize audio processing service for this meeting
      audioProcessingService.initializeMeeting(chunk.meetingId).catch(err => {
        logger.error(`Failed to initialize audio processing for meeting ${chunk.meetingId}:`, err);
      });
    }

    buffer.chunks.push(chunk);
    buffer.totalChunks++;

    logger.info(
      `Audio chunk ${chunk.sequence} added to meeting ${chunk.meetingId} buffer - processing immediately`
    );

    // Process immediately for real-time transcription
    this.processBuffer(chunk.meetingId);
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

    // Process each chunk individually (they're already complete audio files from frontend)
    for (const chunk of chunksToProcess) {
      try {
        logger.info(`Processing chunk ${chunk.sequence} for meeting ${meetingId} (${chunk.chunk.length} base64 chars)`);

        // Decode base64 to Buffer
        const audioBuffer = Buffer.from(chunk.chunk, 'base64');

        // Process through the integrated pipeline
        // The transcription will be sent via the permanent listener set up in constructor
        await audioProcessingService.processAudioChunk({
          data: audioBuffer,
          timestamp: chunk.timestamp.getTime(),
          meetingId,
          chunkIndex: chunk.sequence,
        });

      } catch (error) {
        logger.error(`Error processing chunk ${chunk.sequence} for meeting ${meetingId}:`, error);

        // Continue processing other chunks
        // TODO: Send error via WebSocket
      }
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

      // Clean up audio processing service resources
      audioProcessingService.cleanupMeeting(meetingId).catch(err => {
        logger.error(`Failed to cleanup audio processing for meeting ${meetingId}:`, err);
      });
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
