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

// Admin-only routes
router.post('/recalculate-all', authMiddleware, adminMiddleware, scoreController.recalculateAllScores);
router.post('/config', authMiddleware, adminMiddleware, scoreController.updateScoreConfig);

// Add this with the other routes
router.get('/ai/:walletAddress', authMiddleware, scoreController.getAIScore);
router.get('/enhanced/:walletAddress', scoreController.getEnhancedScore);

export const scoreRoutes = router;