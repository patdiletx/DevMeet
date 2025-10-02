import { Router } from 'express';
import { MeetingController } from '../controllers/meetingController';

const router = Router();

// GET /api/v1/meetings - List all meetings
router.get('/', MeetingController.list);

// GET /api/v1/meetings/:id - Get meeting by ID
router.get('/:id', MeetingController.getById);

// GET /api/v1/meetings/:id/full - Get meeting with all relations
router.get('/:id/full', MeetingController.getByIdWithRelations);

// POST /api/v1/meetings - Create a new meeting
router.post('/', MeetingController.create);

// PATCH /api/v1/meetings/:id - Update a meeting
router.patch('/:id', MeetingController.update);

// POST /api/v1/meetings/:id/end - End a meeting
router.post('/:id/end', MeetingController.end);

// DELETE /api/v1/meetings/:id - Delete a meeting
router.delete('/:id', MeetingController.delete);

export default router;
