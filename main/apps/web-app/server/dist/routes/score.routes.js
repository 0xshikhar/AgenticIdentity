"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scoreRoutes = void 0;
// server/src/routes/score.routes.ts
const express_1 = require("express");
const score_controller_1 = require("../controllers/score.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const scoreController = new score_controller_1.ScoreController();
// Public routes
router.get('/:walletAddress', scoreController.getWalletScore);
// Protected routes
router.get('/history/:walletAddress', auth_middleware_1.authMiddleware, scoreController.getScoreHistory);
router.post('/calculate', auth_middleware_1.authMiddleware, scoreController.calculateScore);
// Admin-only routes
router.post('/recalculate-all', auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, scoreController.recalculateAllScores);
router.post('/config', auth_middleware_1.authMiddleware, auth_middleware_1.adminMiddleware, scoreController.updateScoreConfig);
// Add this with the other routes
router.get('/ai/:walletAddress', auth_middleware_1.authMiddleware, scoreController.getAIScore);
router.get('/enhanced/:walletAddress', scoreController.getEnhancedScore);
exports.scoreRoutes = router;
//# sourceMappingURL=score.routes.js.map