import { Router } from 'express';
import { TranscriptionController } from '../controllers/transcriptionController';

const router = Router();

// GET /api/v1/transcriptions/search - Search transcriptions
router.get('/search', TranscriptionController.search);

// POST /api/v1/transcriptions - Create a new transcription
router.post('/', TranscriptionController.create);

// DELETE /api/v1/transcriptions/:id - Delete a transcription
router.delete('/:id', TranscriptionController.delete);

export default router;
