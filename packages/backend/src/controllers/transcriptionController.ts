import type { Request, Response } from 'express';
import { TranscriptionModel } from '../models';
import type { CreateTranscriptionInput } from '../types';
import { logger } from '../config/logger';

export class TranscriptionController {
  /**
   * GET /api/v1/transcriptions
   * List all transcriptions with optional meeting_id filter
   */
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const meetingId = req.query.meeting_id ? parseInt(req.query.meeting_id as string) : undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      if (meetingId) {
        const transcriptions = await TranscriptionModel.findByMeetingId(meetingId, {
          limit,
          offset,
        });

        res.json({
          success: true,
          data: transcriptions,
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'meeting_id parameter is required',
        });
      }
    } catch (error) {
      logger.error('Error listing transcriptions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list transcriptions',
      });
    }
  }

  /**
   * GET /api/v1/meetings/:meetingId/transcriptions
   * List all transcriptions for a meeting
   */
  static async listByMeeting(req: Request, res: Response): Promise<void> {
    try {
      const meetingId = parseInt(req.params.meetingId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      if (isNaN(meetingId)) {
        res.status(400).json({
          success: false,
          error: 'Invalid meeting ID',
        });
        return;
      }

      const offset = (page - 1) * limit;

      const transcriptions = await TranscriptionModel.findByMeetingId(meetingId, {
        limit,
        offset,
      });

      res.json({
        success: true,
        data: transcriptions,
      });
    } catch (error) {
      logger.error('Error listing transcriptions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list transcriptions',
      });
    }
  }

  /**
   * POST /api/v1/transcriptions
   * Create a new transcription
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const input: CreateTranscriptionInput = {
        meeting_id: req.body.meeting_id,
        content: req.body.content,
        speaker: req.body.speaker,
        timestamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date(),
        confidence: req.body.confidence,
        language: req.body.language,
        duration_seconds: req.body.duration_seconds,
        audio_offset_ms: req.body.audio_offset_ms,
        metadata: req.body.metadata,
      };

      // Validation
      if (!input.meeting_id) {
        res.status(400).json({
          success: false,
          error: 'Meeting ID is required',
        });
        return;
      }

      if (!input.content || input.content.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Transcription content is required',
        });
        return;
      }

      const transcription = await TranscriptionModel.create(input);

      logger.info(`Transcription created for meeting ${input.meeting_id}`);

      res.status(201).json({
        success: true,
        data: transcription,
        message: 'Transcription created successfully',
      });
    } catch (error) {
      logger.error('Error creating transcription:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create transcription',
      });
    }
  }

  /**
   * GET /api/v1/transcriptions/search
   * Search transcriptions by text
   */
  static async search(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query.q as string;
      const meetingId = req.query.meeting_id
        ? parseInt(req.query.meeting_id as string)
        : undefined;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!query || query.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Search query is required',
        });
        return;
      }

      const transcriptions = await TranscriptionModel.search(query, {
        meetingId,
        limit,
      });

      res.json({
        success: true,
        data: transcriptions,
      });
    } catch (error) {
      logger.error('Error searching transcriptions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search transcriptions',
      });
    }
  }

  /**
   * DELETE /api/v1/transcriptions/:id
   * Delete a transcription
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid transcription ID',
        });
        return;
      }

      const deleted = await TranscriptionModel.delete(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Transcription not found',
        });
        return;
      }

      logger.info(`Transcription deleted: ${id}`);

      res.json({
        success: true,
        message: 'Transcription deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting transcription:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete transcription',
      });
    }
  }
}
