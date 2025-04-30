import { Request, Response, NextFunction } from 'express';
import { ScoreService } from '../services/score.service.js';
import { ApiError } from '../utils/api-error.js';
// import { AuthRequest } from '../middleware/auth.middleware.js';
import { validateAddress } from '../utils/blockchain.js';

const SKIP_VALIDATION = process.env.SKIP_ADDRESS_VALIDATION === 'true';

export class ScoreController {
    private scoreService: ScoreService;

    constructor() {
        this.scoreService = new ScoreService();
        // Bind methods to ensure 'this' context is correct
        this.calculateScore = this.calculateScore.bind(this);
        this.getEnhancedScore = this.getEnhancedScore.bind(this);
    }

    /**
     * @description Calculate reputation score for a wallet
     * @route GET /api/score/:walletAddress
     */
    async calculateScore(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
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
            if (!SKIP_VALIDATION && !validateAddress(walletAddress)) {
                throw new ApiError(400, 'Invalid wallet address format');
            }

            // Call the existing service method
            const scoreData = await this.scoreService.calculateReputationScore(walletAddress);
            res.status(200).json(scoreData);
        } catch (error) {
            next(error); // Pass error to the error handling middleware
        }
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
    async getEnhancedScore(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
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
            if (!SKIP_VALIDATION && !validateAddress(walletAddress)) {
                throw new ApiError(400, 'Invalid wallet address format');
            }

            const scoreData = await this.scoreService.getEnhancedReputationScore(walletAddress);
            res.status(200).json({ success: true, data: scoreData });
        } catch (error) {
            next(error);
        }
    }
}