import type { Request, Response } from 'express';
import { ProjectModel } from '../models';
import type { CreateProjectInput, UpdateProjectInput } from '../models/ProjectModel';
import { logger } from '../config/logger';

export class ProjectController {
  /**
   * GET /api/v1/projects
   * List all projects with pagination
   */
  static async list(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const status = req.query.status as string;
      const withMeetings = req.query.withMeetings === 'true';

      const offset = (page - 1) * limit;

      if (withMeetings) {
        const projects = await ProjectModel.findAllWithMeetingCounts();
        res.json({
          success: true,
          data: projects,
        });
      } else {
        const [projects, total] = await Promise.all([
          ProjectModel.findAll({ status, limit, offset }),
          ProjectModel.count(status),
        ]);

        const totalPages = Math.ceil(total / limit);

        res.json({
          success: true,
          data: projects,
          pagination: {
            page,
            limit,
            total,
            totalPages,
          },
        });
      }
    } catch (error) {
      logger.error('Error listing projects:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list projects',
      });
    }
  }

  /**
   * GET /api/v1/projects/:id
   * Get a single project by ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid project ID',
        });
        return;
      }

      const project = await ProjectModel.findById(id);

      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Project not found',
        });
        return;
      }

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      logger.error('Error getting project:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get project',
      });
    }
  }

  /**
   * GET /api/v1/projects/:id/with-meetings
   * Get project with meeting count
   */
  static async getByIdWithMeetingCount(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid project ID',
        });
        return;
      }

      const project = await ProjectModel.findByIdWithMeetingCount(id);

      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Project not found',
        });
        return;
      }

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      logger.error('Error getting project with meeting count:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get project',
      });
    }
  }

  /**
   * POST /api/v1/projects
   * Create a new project
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const input: CreateProjectInput = {
        name: req.body.name,
        description: req.body.description,
        color: req.body.color,
        metadata: req.body.metadata,
      };

      // Validation
      if (!input.name || input.name.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Project name is required',
        });
        return;
      }

      const project = await ProjectModel.create(input);

      logger.info(`Project created: ${project.id} - ${project.name}`);

      res.status(201).json({
        success: true,
        data: project,
        message: 'Project created successfully',
      });
    } catch (error) {
      logger.error('Error creating project:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create project',
      });
    }
  }

  /**
   * PATCH /api/v1/projects/:id
   * Update a project
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid project ID',
        });
        return;
      }

      const input: UpdateProjectInput = {
        name: req.body.name,
        description: req.body.description,
        color: req.body.color,
        status: req.body.status,
        metadata: req.body.metadata,
      };

      const project = await ProjectModel.update(id, input);

      if (!project) {
        res.status(404).json({
          success: false,
          error: 'Project not found',
        });
        return;
      }

      logger.info(`Project updated: ${project.id}`);

      res.json({
        success: true,
        data: project,
        message: 'Project updated successfully',
      });
    } catch (error) {
      logger.error('Error updating project:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update project',
      });
    }
  }

  /**
   * DELETE /api/v1/projects/:id
   * Delete a project
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid project ID',
        });
        return;
      }

      const deleted = await ProjectModel.delete(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Project not found',
        });
        return;
      }

      logger.info(`Project deleted: ${id}`);

      res.json({
        success: true,
        message: 'Project deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting project:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete project',
      });
    }
  }
}
