import { Request, Response, NextFunction } from 'express';
import { ScoreService } from '../services/score.service';
import { ApiError } from '../utils/api-error';
import { AuthRequest } from '../middleware/auth.middleware';
import { validateAddress } from '../utils/blockchain';

export class ScoreController {
    private scoreService: ScoreService;

    constructor() {
        this.scoreService = new ScoreService();
    }

    getWalletScore = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { walletAddress } = req.params;

            if (!validateAddress(walletAddress)) {
                throw ApiError.badRequest('Invalid wallet address format');
            }

            const score = await this.scoreService.getReputationScore(walletAddress);
            res.status(200).json({ success: true, data: score });
        } catch (error) {
            next(error);
        }
    }

    getScoreHistory = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { walletAddress } = req.params;
            const { period } = req.query;

            if (!validateAddress(walletAddress)) {
                throw ApiError.badRequest('Invalid wallet address format');
            }

            const history = await this.scoreService.getScoreHistory(
                walletAddress,
                period as string || '30d'
            );

            res.status(200).json({ success: true, data: history });
        } catch (error) {
            next(error);
        }
    }

    calculateScore = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { walletAddress, forceRefresh } = req.body;

            if (!walletAddress) {
                throw ApiError.badRequest('Wallet address is required');
            }

            if (!validateAddress(walletAddress)) {
                throw ApiError.badRequest('Invalid wallet address format');
            }

            const score = await this.scoreService.calculateReputationScore(
                walletAddress,
                forceRefresh || false
            );

            res.status(200).json({ success: true, data: score });
        } catch (error) {
            next(error);
        }
    }

    recalculateAllScores = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // This could be a long-running task
            // Consider implementing a queue for this in production
            const jobId = await this.scoreService.recalculateAllScores();

            res.status(202).json({
                success: true,
                message: 'Score recalculation job started',
                jobId
            });
        } catch (error) {
            next(error);
        }
    }

    updateScoreConfig = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { weights } = req.body;

            if (!weights) {
                throw ApiError.badRequest('Score weights configuration is required');
            }

            const updatedConfig = await this.scoreService.updateScoreConfig(weights);

            res.status(200).json({
                success: true,
                data: updatedConfig
            });
        } catch (error) {
            next(error);
        }
    }
}