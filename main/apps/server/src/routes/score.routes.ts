// server/src/routes/score.routes.ts
import { Router } from 'express';
import { ScoreController } from '../controllers/score.controller.js';
// Import middleware if still used
// import { authMiddleware } from '../middleware/auth.middleware.js';
// import { adminMiddleware } from '../middleware/admin.middleware.js';

// IMPORTANT: Export the router directly, not another variable
export const scoreRoutes = Router();
const scoreController = new ScoreController();

// Specific routes first
scoreRoutes.get('/enhanced/:walletAddress', scoreController.getEnhancedScore);

// Generic routes last
scoreRoutes.get('/:walletAddress', scoreController.calculateScore);

// Remove or comment out routes for removed controller methods
// scoreRoutes.get('/history/:walletAddress', authMiddleware, scoreController.getScoreHistory);
// scoreRoutes.post('/calculate', authMiddleware, scoreController.calculateScore);
// scoreRoutes.post('/recalculate-all', authMiddleware, adminMiddleware, scoreController.recalculateAllScores);
// scoreRoutes.post('/config', authMiddleware, adminMiddleware, scoreController.updateScoreConfig);
// scoreRoutes.get('/ai/:walletAddress', authMiddleware, scoreController.getAIScore);
