import type { Request, Response } from 'express';
import { MeetingModel } from '../models';
import type { CreateMeetingInput, UpdateMeetingInput } from '../types';
import { logger } from '../config/logger';

export class MeetingController {
  /**
   * GET /api/v1/meetings
   * List all meetings with pagination
   */
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as any;
      const project_id = req.query.project_id ? parseInt(req.query.project_id as string) : undefined;

      const offset = (page - 1) * limit;

      const [meetings, total] = await Promise.all([
        MeetingModel.findAll({ status, project_id, limit, offset }),
        MeetingModel.count(status),
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: meetings,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (error) {
      logger.error('Error listing meetings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list meetings',
      });
    }
  }

  /**
   * GET /api/v1/meetings/:id
   * Get a single meeting by ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid meeting ID',
        });
      }

      const meeting = await MeetingModel.findById(id);

      if (!meeting) {
        res.status(404).json({
          success: false,
          error: 'Meeting not found',
        });
      }

      res.json({
        success: true,
        data: meeting,
      });
    } catch (error) {
      logger.error('Error getting meeting:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get meeting',
      });
    }
  }

  /**
   * GET /api/v1/meetings/:id/full
   * Get meeting with all related data (transcriptions, notes, etc.)
   */
  static async getByIdWithRelations(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid meeting ID',
        });
      }

      const meeting = await MeetingModel.findByIdWithRelations(id);

      if (!meeting) {
        res.status(404).json({
          success: false,
          error: 'Meeting not found',
        });
      }

      res.json({
        success: true,
        data: meeting,
      });
    } catch (error) {
      logger.error('Error getting meeting with relations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get meeting',
      });
    }
  }

  /**
   * POST /api/v1/meetings
   * Create a new meeting
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const input: CreateMeetingInput = {
        title: req.body.title,
        description: req.body.description,
        project_id: req.body.project_id,
        metadata: req.body.metadata,
      };

      // Validation
      if (!input.title || input.title.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Meeting title is required',
        });
      }

      const meeting = await MeetingModel.create(input);

      logger.info(`Meeting created: ${meeting.id} - ${meeting.title}`);

      res.status(201).json({
        success: true,
        data: meeting,
        message: 'Meeting created successfully',
      });
    } catch (error) {
      logger.error('Error creating meeting:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create meeting',
      });
    }
  }

  /**
   * PATCH /api/v1/meetings/:id
   * Update a meeting
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid meeting ID',
        });
      }

      const input: UpdateMeetingInput = {
        title: req.body.title,
        description: req.body.description,
        project_id: req.body.project_id,
        ended_at: req.body.ended_at,
        status: req.body.status,
        audio_file_path: req.body.audio_file_path,
        metadata: req.body.metadata,
      };

      const meeting = await MeetingModel.update(id, input);

      if (!meeting) {
        res.status(404).json({
          success: false,
          error: 'Meeting not found',
        });
        return;
      }

      logger.info(`Meeting updated: ${meeting.id}`);

      res.json({
        success: true,
        data: meeting,
        message: 'Meeting updated successfully',
      });
    } catch (error) {
      logger.error('Error updating meeting:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update meeting',
      });
    }
  }

  /**
   * POST /api/v1/meetings/:id/end
   * End a meeting
   */
  static async end(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid meeting ID',
        });
      }

      const meeting = await MeetingModel.end(id);

      if (!meeting) {
        res.status(404).json({
          success: false,
          error: 'Meeting not found',
        });
        return;
      }

      logger.info(`Meeting ended: ${meeting.id}`);

      res.json({
        success: true,
        data: meeting,
        message: 'Meeting ended successfully',
      });
    } catch (error) {
      logger.error('Error ending meeting:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to end meeting',
      });
    }
  }

  /**
   * DELETE /api/v1/meetings/:id
   * Delete a meeting
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid meeting ID',
        });
      }

      const deleted = await MeetingModel.delete(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Meeting not found',
        });
      }

      logger.info(`Meeting deleted: ${id}`);

      res.json({
        success: true,
        message: 'Meeting deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting meeting:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete meeting',
      });
    }
  }
}
