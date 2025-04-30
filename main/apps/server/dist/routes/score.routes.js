"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// server/src/routes/score.routes.ts
const express_1 = require("express");
const score_controller_js_1 = require("../controllers/score.controller.js");
// Import middleware if still used
// import { authMiddleware } from '../middleware/auth.middleware.js';
// import { adminMiddleware } from '../middleware/admin.middleware.js';
// IMPORTANT: Export the router directly, not another variable
const router = (0, express_1.Router)();
const scoreController = new score_controller_js_1.ScoreController();
// Specific routes first
router.get('/enhanced/:walletAddress', scoreController.getEnhancedScore);
// Generic routes last
router.get('/:walletAddress', scoreController.calculateScore);
// Add a dedicated health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'ok',
        message: 'Score API is healthy',
        timestamp: new Date().toISOString()
    });
});
// Remove or comment out routes for removed controller methods
// scoreRoutes.get('/history/:walletAddress', authMiddleware, scoreController.getScoreHistory);
// scoreRoutes.post('/calculate', authMiddleware, scoreController.calculateScore);
// scoreRoutes.post('/recalculate-all', authMiddleware, adminMiddleware, scoreController.recalculateAllScores);
// scoreRoutes.post('/config', authMiddleware, adminMiddleware, scoreController.updateScoreConfig);
// scoreRoutes.get('/ai/:walletAddress', authMiddleware, scoreController.getAIScore);
exports.default = router;
//# sourceMappingURL=score.routes.js.map