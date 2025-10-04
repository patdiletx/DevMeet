import { Router } from 'express';
import { ProjectController } from '../controllers/projectController';
import { ProjectDocumentModel } from '../models';
import { logger } from '../config/logger';

const router = Router();

// GET /api/v1/projects - List all projects
router.get('/', ProjectController.list);

// GET /api/v1/projects/:id - Get project by ID
router.get('/:id', ProjectController.getById);

// GET /api/v1/projects/:id/with-meetings - Get project with meeting count
router.get('/:id/with-meetings', ProjectController.getByIdWithMeetingCount);

// POST /api/v1/projects - Create a new project
router.post('/', ProjectController.create);

// PATCH /api/v1/projects/:id - Update a project
router.patch('/:id', ProjectController.update);

// DELETE /api/v1/projects/:id - Delete a project
router.delete('/:id', ProjectController.delete);

// ===== Project Documents Routes =====

// GET /api/v1/projects/:projectId/documents - List all documents for a project
router.get('/:projectId/documents', async (req, res) => {
  try {
    const { projectId } = req.params;
    const documents = await ProjectDocumentModel.findByProjectId(parseInt(projectId));

    res.json({
      success: true,
      data: documents,
    });
  } catch (error: any) {
    logger.error('Error listing project documents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list documents',
    });
  }
});

// GET /api/v1/projects/:projectId/documents/:id - Get document by ID
router.get('/:projectId/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const document = await ProjectDocumentModel.findById(parseInt(id));

    if (!document) {
      res.status(404).json({
        success: false,
        error: 'Document not found',
      });
      return;
    }

    res.json({
      success: true,
      data: document,
    });
  } catch (error: any) {
    logger.error('Error getting document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get document',
    });
  }
});

// POST /api/v1/projects/:projectId/documents - Create a new document
router.post('/:projectId/documents', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, content, file_type, file_size, file_url, metadata } = req.body;

    if (!title || !content) {
      res.status(400).json({
        success: false,
        error: 'Title and content are required',
      });
      return;
    }

    const document = await ProjectDocumentModel.create({
      project_id: parseInt(projectId),
      title,
      content,
      file_type,
      file_size,
      file_url,
      metadata,
    });

    logger.info(`Document created for project ${projectId}: ${document.id}`);

    res.status(201).json({
      success: true,
      data: document,
    });
  } catch (error: any) {
    logger.error('Error creating document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create document',
    });
  }
});

// PATCH /api/v1/projects/:projectId/documents/:id - Update a document
router.patch('/:projectId/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, file_type, file_size, file_url, metadata } = req.body;

    const document = await ProjectDocumentModel.update(parseInt(id), {
      title,
      content,
      file_type,
      file_size,
      file_url,
      metadata,
    });

    if (!document) {
      res.status(404).json({
        success: false,
        error: 'Document not found',
      });
      return;
    }

    logger.info(`Document updated: ${id}`);

    res.json({
      success: true,
      data: document,
    });
  } catch (error: any) {
    logger.error('Error updating document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update document',
    });
  }
});

// DELETE /api/v1/projects/:projectId/documents/:id - Delete a document
router.delete('/:projectId/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ProjectDocumentModel.delete(parseInt(id));

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Document not found',
      });
      return;
    }

    logger.info(`Document deleted: ${id}`);

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error: any) {
    logger.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete document',
    });
  }
});

export default router;
