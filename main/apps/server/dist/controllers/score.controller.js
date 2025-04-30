"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreController = void 0;
const score_service_js_1 = require("../services/score.service.js");
const api_error_js_1 = require("../utils/api-error.js");
// import { AuthRequest } from '../middleware/auth.middleware.js';
const blockchain_js_1 = require("../utils/blockchain.js");
const SKIP_VALIDATION = process.env.SKIP_ADDRESS_VALIDATION === 'true';
class ScoreController {
    constructor() {
        this.scoreService = new score_service_js_1.ScoreService();
        // Bind methods to ensure 'this' context is correct
        this.calculateScore = this.calculateScore.bind(this);
        this.getEnhancedScore = this.getEnhancedScore.bind(this);
    }
    /**
     * @description Calculate reputation score for a wallet
     * @route GET /api/score/:walletAddress
     */
    calculateScore(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { walletAddress } = req.params;
                // Special handling for health checks
                if (walletAddress === 'health') {
                    return res.status(200).json({
                        success: true,
                        status: 'ok',
                        message: 'Score API is healthy',
                        timestamp: new Date().toISOString()
                    });
                }
                // Validate the wallet address format
                if (!SKIP_VALIDATION && !(0, blockchain_js_1.validateAddress)(walletAddress)) {
                    throw new api_error_js_1.ApiError(400, 'Invalid wallet address format');
                }
                // Call the existing service method
                const scoreData = yield this.scoreService.calculateReputationScore(walletAddress);
                res.status(200).json(scoreData);
            }
            catch (error) {
                next(error); // Pass error to the error handling middleware
            }
        });
    }
    // Removed getScore handler (was calling getReputationScore)
    // Removed getHistory handler (was calling getScoreHistory)
    // Removed recalculateAll handler (was calling recalculateAllScores)
    // Removed updateConfig handler (was calling updateScoreConfig)
    // Removed getAIScore handler (was calling getAIGeneratedScore)
    // Removed getEnhancedScore handler (was calling getEnhancedReputationScore)
    /**
     * @description Get enhanced reputation score for a wallet (using AI)
     * @route GET /api/score/enhanced/:walletAddress
     */
    getEnhancedScore(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { walletAddress } = req.params;
                console.log('walletAddress in getEnhancedScore: ', walletAddress);
                // Special handling for health checks
                if (walletAddress === 'health') {
                    return res.status(200).json({
                        success: true,
                        data: {
                            status: 'ok',
                            message: 'Enhanced Score API is healthy',
                            timestamp: new Date().toISOString()
                        }
                    });
                }
                // Validate the wallet address format
                if (!SKIP_VALIDATION && !(0, blockchain_js_1.validateAddress)(walletAddress)) {
                    throw new api_error_js_1.ApiError(400, 'Invalid wallet address format');
                }
                const scoreData = yield this.scoreService.getEnhancedReputationScore(walletAddress);
                res.status(200).json({ success: true, data: scoreData });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.ScoreController = ScoreController;
//# sourceMappingURL=score.controller.js.map