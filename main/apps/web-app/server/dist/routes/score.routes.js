"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreRoutes = void 0;
// server/src/routes/score.routes.ts
const express_1 = require("express");
const score_controller_js_1 = require("../controllers/score.controller.js");
// Import middleware if still used
// import { authMiddleware } from '../middleware/auth.middleware.js';
// import { adminMiddleware } from '../middleware/admin.middleware.js';
// IMPORTANT: Export the router directly, not another variable
exports.scoreRoutes = (0, express_1.Router)();
const scoreController = new score_controller_js_1.ScoreController();
// Specific routes first
exports.scoreRoutes.get('/enhanced/:walletAddress', scoreController.getEnhancedScore);
// Generic routes last
exports.scoreRoutes.get('/:walletAddress', scoreController.calculateScore);
// Remove or comment out routes for removed controller methods
// scoreRoutes.get('/history/:walletAddress', authMiddleware, scoreController.getScoreHistory);
// scoreRoutes.post('/calculate', authMiddleware, scoreController.calculateScore);
// scoreRoutes.post('/recalculate-all', authMiddleware, adminMiddleware, scoreController.recalculateAllScores);
// scoreRoutes.post('/config', authMiddleware, adminMiddleware, scoreController.updateScoreConfig);
// scoreRoutes.get('/ai/:walletAddress', authMiddleware, scoreController.getAIScore);
//# sourceMappingURL=score.routes.js.map