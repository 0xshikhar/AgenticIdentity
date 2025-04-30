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
const score_service_1 = require("../services/score.service");
const api_error_1 = require("../utils/api-error");
// import { AuthRequest } from '../middleware/auth.middleware';
const blockchain_1 = require("../utils/blockchain");
class ScoreController {
    constructor() {
        this.getWalletScore = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { walletAddress } = req.params;
                if (!(0, blockchain_1.validateAddress)(walletAddress)) {
                    throw api_error_1.ApiError.badRequest('Invalid wallet address format');
                }
                const score = yield this.scoreService.getReputationScore(walletAddress);
                res.status(200).json({ success: true, data: score });
            }
            catch (error) {
                next(error);
            }
        });
        this.getScoreHistory = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { walletAddress } = req.params;
                const { period } = req.query;
                if (!(0, blockchain_1.validateAddress)(walletAddress)) {
                    throw api_error_1.ApiError.badRequest('Invalid wallet address format');
                }
                const history = yield this.scoreService.getScoreHistory(walletAddress, period || '30d');
                res.status(200).json({ success: true, data: history });
            }
            catch (error) {
                next(error);
            }
        });
        this.calculateScore = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { walletAddress, forceRefresh } = req.body;
                if (!walletAddress) {
                    throw api_error_1.ApiError.badRequest('Wallet address is required');
                }
                if (!(0, blockchain_1.validateAddress)(walletAddress)) {
                    throw api_error_1.ApiError.badRequest('Invalid wallet address format');
                }
                const score = yield this.scoreService.calculateReputationScore(walletAddress, forceRefresh || false);
                res.status(200).json({ success: true, data: score });
            }
            catch (error) {
                next(error);
            }
        });
        this.recalculateAllScores = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                // This could be a long-running task
                // Consider implementing a queue for this in production
                const jobId = yield this.scoreService.recalculateAllScores();
                res.status(202).json({
                    success: true,
                    message: 'Score recalculation job started',
                    jobId
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.updateScoreConfig = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { weights } = req.body;
                if (!weights) {
                    throw api_error_1.ApiError.badRequest('Score weights configuration is required');
                }
                const updatedConfig = yield this.scoreService.updateScoreConfig(weights);
                res.status(200).json({
                    success: true,
                    data: updatedConfig
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.getAIScore = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { walletAddress } = req.params;
                if (!(0, blockchain_1.validateAddress)(walletAddress)) {
                    throw api_error_1.ApiError.badRequest('Invalid wallet address format');
                }
                const score = yield this.scoreService.getAIGeneratedScore(walletAddress);
                res.status(200).json({ success: true, data: score });
            }
            catch (error) {
                next(error);
            }
        });
        this.getEnhancedScore = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { walletAddress } = req.params;
                if (!(0, blockchain_1.validateAddress)(walletAddress)) {
                    throw api_error_1.ApiError.badRequest('Invalid wallet address format');
                }
                const score = yield this.scoreService.getEnhancedReputationScore(walletAddress);
                res.status(200).json({ success: true, data: score });
            }
            catch (error) {
                next(error);
            }
        });
        this.scoreService = new score_service_1.ScoreService();
    }
}
exports.ScoreController = ScoreController;
//# sourceMappingURL=score.controller.js.map