// server/src/routes/score.routes.ts
import { Router } from 'express';
import { ScoreController } from '../controllers/score.controller'; 
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware';

const router = Router();
const scoreController = new ScoreController();

// Public routes
router.get('/:walletAddress', scoreController.getWalletScore);

// Protected routes
router.get('/history/:walletAddress', authMiddleware, scoreController.getScoreHistory);
router.post('/calculate', authMiddleware, scoreController.calculateScore);

// Admin routes
router.post('/recalculate-all', authMiddleware, adminMiddleware, scoreController.recalculateAllScores);
router.put('/config', authMiddleware, adminMiddleware, scoreController.updateScoreConfig);

export const scoreRoutes = router;