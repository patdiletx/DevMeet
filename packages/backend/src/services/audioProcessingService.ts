import { EventEmitter } from 'events';
import { assemblyaiService } from './assemblyaiService';
import { aiService } from './aiService';
import { TranscriptionModel } from '../models';
import { logger } from '../config/logger';

export interface AudioChunk {
  data: Buffer;
  timestamp: number;
  meetingId: number;
  chunkIndex: number;
}

export interface ProcessedTranscription {
  transcriptionId: number;
  meetingId: number;
  content: string;
  speaker: string | null;
  timestamp: string;
  confidence: number;
  startTime: number;
  endTime: number;
}

export interface ActionItem {
  description: string;
  assignee: string | null;
  priority: 'low' | 'medium' | 'high';
  detectedAt: string;
}

/**
 * Audio Processing Service
 * Handles the complete pipeline: Audio → Whisper → Database → Claude Analysis
 */
class AudioProcessingService extends EventEmitter {
  private processingQueues: Map<number, AudioChunk[]> = new Map();
  private transcriptionContexts: Map<number, string[]> = new Map();
  private isProcessing: Map<number, boolean> = new Map();
  private chunkCounters: Map<number, number> = new Map();

  constructor() {
    super();
  }

  /**
   * Initialize audio processing for a meeting
   */
  async initializeMeeting(meetingId: number): Promise<void> {
    logger.info(`Initializing audio processing for meeting ${meetingId}`);

    this.processingQueues.set(meetingId, []);
    this.transcriptionContexts.set(meetingId, []);
    this.isProcessing.set(meetingId, false);
    this.chunkCounters.set(meetingId, 0);

    // Initialize Whisper service
    await assemblyaiService.initialize();
  }

  /**
   * Process incoming audio chunk
   */
  async processAudioChunk(audioChunk: AudioChunk): Promise<void> {
    const { meetingId, data } = audioChunk;

    // Validate audio buffer
    if (!assemblyaiService.isValidAudioBuffer(data)) {
      logger.warn(`Invalid audio buffer for meeting ${meetingId}`);
      return;
    }

    // Add to processing queue
    const queue = this.processingQueues.get(meetingId) || [];
    queue.push(audioChunk);
    this.processingQueues.set(meetingId, queue);

    // Start processing if not already running
    if (!this.isProcessing.get(meetingId)) {
      await this.processQueue(meetingId);
    }
  }

  /**
   * Process audio queue for a meeting
   */
  private async processQueue(meetingId: number): Promise<void> {
    this.isProcessing.set(meetingId, true);

    const queue = this.processingQueues.get(meetingId) || [];

    while (queue.length > 0) {
      const chunk = queue.shift();
      if (!chunk) continue;

      try {
        await this.processChunk(chunk);
      } catch (error: any) {
        logger.error(`Error processing chunk for meeting ${meetingId}:`, error);
        // Continue processing other chunks
      }
    }

    this.isProcessing.set(meetingId, false);
  }

  /**
   * Process a single audio chunk through the complete pipeline
   */
  private async processChunk(chunk: AudioChunk): Promise<void> {
    const { meetingId, data, chunkIndex, timestamp } = chunk;

    logger.info(`Processing chunk ${chunkIndex} for meeting ${meetingId}`);

    try {
      // Step 1: Get transcription context
      const _context = this.getTranscriptionContext(meetingId);

      // Step 2: Transcribe with Whisper
      const transcriptionResult = await assemblyaiService.transcribeChunk(
        data,
        chunkIndex,
        _context
      );

      if (!transcriptionResult.text || transcriptionResult.text.trim().length === 0) {
        logger.info(`Empty transcription for chunk ${chunkIndex}, skipping`);
        return;
      }

      // Step 3: Save to database
      const transcription: any = await TranscriptionModel.create({
        meeting_id: meetingId,
        content: transcriptionResult.text,
        speaker: await this.detectSpeaker(transcriptionResult.text, _context) || undefined,
        timestamp: new Date(timestamp),
        confidence: this.calculateConfidence(transcriptionResult),
        metadata: {
          language: transcriptionResult.language,
          duration: transcriptionResult.duration,
          segmentCount: transcriptionResult.segments?.length || 0,
          start_time: transcriptionResult.segments?.[0]?.start || 0,
          end_time: transcriptionResult.segments?.[transcriptionResult.segments.length - 1]?.end || 0,
        },
      });

      // Step 4: Update context
      this.addToContext(meetingId, transcriptionResult.text);

      // Step 5: Emit transcription event
      const transcriptionEvent = {
        transcriptionId: transcription.id,
        meetingId,
        content: transcription.content,
        speaker: transcription.speaker,
        timestamp: transcription.timestamp?.toISOString() || new Date().toISOString(),
        confidence: transcription.confidence,
        startTime: transcription.start_time || 0,
        endTime: transcription.end_time || 0,
      };

      logger.info(`🔔 Emitting transcription event for ID ${transcription.id}: "${transcription.content.substring(0, 50)}..."`);
      this.emit('transcription', transcriptionEvent);

      // Step 6: Analyze for action items (every 5 transcriptions)
      const counter = (this.chunkCounters.get(meetingId) || 0) + 1;
      this.chunkCounters.set(meetingId, counter);

      if (counter % 5 === 0) {
        await this.analyzeForActionItems(meetingId);
      }

      logger.info(`Successfully processed chunk ${chunkIndex} for meeting ${meetingId}`);
    } catch (error: any) {
      logger.error(`Failed to process chunk ${chunkIndex}:`, error);
      throw error;
    }
  }

  /**
   * Get transcription context for better accuracy
   */
  private getTranscriptionContext(meetingId: number): string {
    const contexts = this.transcriptionContexts.get(meetingId) || [];
    return assemblyaiService.buildContext(contexts);
  }

  /**
   * Add transcription to context
   */
  private addToContext(meetingId: number, text: string): void {
    const contexts = this.transcriptionContexts.get(meetingId) || [];
    contexts.push(text);

    // Keep only last 10 transcriptions for context
    if (contexts.length > 10) {
      contexts.shift();
    }

    this.transcriptionContexts.set(meetingId, contexts);
  }

  /**
   * Calculate confidence score from Whisper result
   */
  private calculateConfidence(result: any): number {
    // Whisper doesn't provide confidence scores directly
    // We estimate based on segment count and text length
    if (!result.segments || result.segments.length === 0) {
      return 0.7; // Default confidence
    }

    // More segments usually means better transcription
    const segmentScore = Math.min(result.segments.length / 10, 1);

    // Longer text usually means more confident transcription
    const lengthScore = Math.min(result.text.length / 100, 1);

    return (segmentScore * 0.4 + lengthScore * 0.6) * 0.9 + 0.1; // Scale to 0.1-1.0
  }

  /**
   * Simple speaker detection based on context
   * This is a basic implementation - can be enhanced with speaker diarization
   */
  private async detectSpeaker(text: string, _context: string): Promise<string | null> {
    // For now, return a simple speaker identifier
    // In production, this would use speaker diarization AI models
    const speakerPatterns = [
      /^([\w\s]+):/i, // "John: ..."
      /\[([\w\s]+)\]/i, // "[Sarah] ..."
    ];

    for (const pattern of speakerPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return null; // Unknown speaker
  }

  /**
   * Analyze recent transcriptions for action items
   */
  private async analyzeForActionItems(meetingId: number): Promise<void> {
    try {
      logger.info(`Analyzing meeting ${meetingId} for action items`);

      // Get recent transcriptions
      const transcriptions = await TranscriptionModel.findByMeetingId(meetingId, { limit: 50, offset: 0 });

      if (transcriptions.length === 0) {
        return;
      }

      // Build transcript text
      const transcript = transcriptions
        .map((t: any) => `[${t.timestamp}] ${t.speaker || 'Unknown'}: ${t.content}`)
        .join('\n');

      // Detect action items using Claude
      const actionItems = await aiService.detectActionItems(transcript);

      // Save action items to database
      for (const item of actionItems) {
        // TODO: Create ActionItemModel and save to database
        // await ActionItemModel.create({
        //   meeting_id: meetingId,
        //   description: item.description,
        //   assigned_to: item.assignee,
        //   priority: item.priority,
        //   status: 'pending',
        // });

        // Emit action item event
        this.emit('action_item', {
          meetingId,
          ...item,
          detectedAt: new Date().toISOString(),
        } as ActionItem);

        logger.info(`Action item detected: ${item.description}`);
      }

      logger.info(`Detected ${actionItems.length} action items for meeting ${meetingId}`);
    } catch (error: any) {
      logger.error(`Failed to analyze action items for meeting ${meetingId}:`, error);
    }
  }

  /**
   * Generate meeting summary
   */
  async generateSummary(meetingId: number): Promise<string> {
    try {
      logger.info(`Generating summary for meeting ${meetingId}`);

      // Get all transcriptions
      const transcriptions = await TranscriptionModel.findByMeetingId(meetingId, { limit: 1000, offset: 0 });

      if (transcriptions.length === 0) {
        return 'No transcriptions available for this meeting.';
      }

      // Build transcript text
      const transcript = transcriptions
        .map((t: any) => `[${t.timestamp}] ${t.speaker || 'Unknown'}: ${t.content}`)
        .join('\n');

      // Generate summary using Claude
      const analysis = await aiService.analyzeMeeting(transcript);

      // Update meeting with summary (using the Meeting model would be better)
      // For now, we'll just return the summary
      logger.info(`Summary: ${analysis.summary}`);

      logger.info(`Summary generated for meeting ${meetingId}`);

      return analysis.summary;
    } catch (error: any) {
      logger.error(`Failed to generate summary for meeting ${meetingId}:`, error);
      throw error;
    }
  }

  /**
   * Clean up meeting resources
   */
  async cleanupMeeting(meetingId: number): Promise<void> {
    logger.info(`Cleaning up resources for meeting ${meetingId}`);

    this.processingQueues.delete(meetingId);
    this.transcriptionContexts.delete(meetingId);
    this.isProcessing.delete(meetingId);
    this.chunkCounters.delete(meetingId);

    // Generate final summary
    await this.generateSummary(meetingId);
  }

  /**
   * Get processing stats for a meeting
   */
  getStats(meetingId: number): {
    queueLength: number;
    isProcessing: boolean;
    chunksProcessed: number;
    contextSize: number;
  } {
    return {
      queueLength: this.processingQueues.get(meetingId)?.length || 0,
      isProcessing: this.isProcessing.get(meetingId) || false,
      chunksProcessed: this.chunkCounters.get(meetingId) || 0,
      contextSize: this.transcriptionContexts.get(meetingId)?.length || 0,
    };
  }
}

// Export singleton instance
export const audioProcessingService = new AudioProcessingService();
