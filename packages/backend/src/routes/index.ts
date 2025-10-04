import { Router } from 'express';
import meetingRoutes from './meetingRoutes';
import transcriptionRoutes from './transcriptionRoutes';
import aiRoutes from './ai.routes';

const router = Router();

// Mount routes
router.use('/meetings', meetingRoutes);
router.use('/transcriptions', transcriptionRoutes);
router.use('/ai', aiRoutes);

// Health check route (also available at root /health)
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
