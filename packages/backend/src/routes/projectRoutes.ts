import { Router } from 'express';
import { ProjectController } from '../controllers/projectController';

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

export default router;
