// server/src/services/score.service.ts
import { prisma } from '../index';
import { config } from '../config/config';
import { ApiError } from '../utils/api-error';
import { TransactionService } from './transaction.service'; 
import { WalletService } from './wallet.service';
import { calculateReputationScore } from '../utils/score-calculator';

export class ScoreService {
    private transactionService: TransactionService;
    private walletService: WalletService;

    constructor() {
        this.transactionService = new TransactionService();
        this.walletService = new WalletService();
    }

    async getReputationScore(walletAddress: string) {
        // Check if there's a recent score in the database
        const latestScore = await prisma.reputationScore.findFirst({
            where: {
                walletAddress: walletAddress.toLowerCase(),
            },
            orderBy: {
                timestamp: 'desc'
            }
        });

        // If we have a recent score and it's within our cache window, return it
        if (latestScore && this.isScoreValid(latestScore.timestamp)) {
            return {
                score: latestScore.score,
                timestamp: latestScore.timestamp,
                factors: JSON.parse(latestScore.factors),
                isCached: true
            };
        }

        // Otherwise, calculate a new score
        return this.calculateReputationScore(walletAddress);
    }

    async getScoreHistory(walletAddress: string, period: string) {
        // Parse the period (e.g., "30d", "6m", "1y")
        const duration = this.parseDuration(period);
        const startDate = new Date();
        startDate.setTime(startDate.getTime() - duration);

        // Get scores from the database
        const scores = await prisma.reputationScore.findMany({
            where: {
                walletAddress: walletAddress.toLowerCase(),
                timestamp: {
                    gte: startDate
                }
            },
            orderBy: {
                timestamp: 'asc'
            }
        });

        // Format the scores for response
        return scores.map(score => ({
            score: score.score,
            timestamp: score.timestamp,
            factors: JSON.parse(score.factors)
        }));
    }

    async calculateReputationScore(walletAddress: string, forceRefresh: boolean = false) {
        // If not forcing refresh, check if there's a recent score
        if (!forceRefresh) {
            const latestScore = await prisma.reputationScore.findFirst({
                where: {
                    walletAddress: walletAddress.toLowerCase(),
                },
                orderBy: {
                    timestamp: 'desc'
                }
            });

            if (latestScore && this.isScoreValid(latestScore.timestamp)) {
                return {
                    score: latestScore.score,
                    timestamp: latestScore.timestamp,
                    factors: JSON.parse(latestScore.factors),
                    isCached: true
                };
            }
        }

        // Get wallet info and transaction history
        const walletInfo = await this.walletService.getWalletInfo(walletAddress);
        const transactionStats = await this.transactionService.getTransactionStats(walletAddress);

        // Calculate the score
        const { score, factors } = calculateReputationScore(walletInfo, transactionStats, config.scoreConfig.weights);

        // Save the score to the database
        const savedScore = await prisma.reputationScore.create({
            data: {
                walletAddress: walletAddress.toLowerCase(),
                score,
                factors: JSON.stringify(factors),
                timestamp: new Date()
            }
        });

        return {
            score: savedScore.score,
            timestamp: savedScore.timestamp,
            factors: JSON.parse(savedScore.factors),
            isCached: false
        };
    }

    async recalculateAllScores() {
        // In a real system, this would likely be a background job
        // For simplicity, we'll just generate a job ID here
        const jobId = `recalc-${Date.now()}`;

        // Start the job asynchronously
        setTimeout(async () => {
            try {
                // Get all registered wallets
                const wallets = await prisma.wallet.findMany();

                // Recalculate scores for each wallet
                for (const wallet of wallets) {
                    await this.calculateReputationScore(wallet.address, true);
                }

                console.log(`Recalculation job ${jobId} completed successfully`);
            } catch (error) {
                console.error(`Recalculation job ${jobId} failed:`, error);
            }
        }, 0);

        return jobId;
    }

    async updateScoreConfig(weights: any) {
        // Validate weights
        const requiredWeights = [
            'walletAge', 'transactionVolume', 'transactionFrequency',
            'contractInteractions', 'networkDiversity', 'stakingHistory'
        ];

        for (const weight of requiredWeights) {
            if (typeof weights[weight] !== 'number' || weights[weight] < 0 || weights[weight] > 1) {
                throw ApiError.badRequest(`Invalid weight for ${weight}. Must be a number between 0 and 1`);
            }
        }

        // Check if weights sum to 1
        const sum = Object.values(weights).reduce((a: any, b: any) => a + b, 0);
        if (Math.abs(sum - 1) > 0.001) {
            throw ApiError.badRequest('Weights must sum to 1');
        }

        // Update config
        config.scoreConfig.weights = weights;

        // In a real application, you would also persist this to a database

        return config.scoreConfig;
    }

    // Helper methods
    private isScoreValid(timestamp: Date): boolean {
        const now = new Date();
        const cacheAge = (now.getTime() - timestamp.getTime()) / 1000; // in seconds
        return cacheAge < config.scoreConfig.cacheDuration;
    }

    private parseDuration(period: string): number {
        const value = parseInt(period.slice(0, -1));
        const unit = period.slice(-1).toLowerCase();

        switch (unit) {
            case 'd': // days
                return value * 24 * 60 * 60 * 1000;
            case 'w': // weeks
                return value * 7 * 24 * 60 * 60 * 1000;
            case 'm': // months (approximate)
                return value * 30 * 24 * 60 * 60 * 1000;
            case 'y': // years (approximate)
                return value * 365 * 24 * 60 * 60 * 1000;
            default:
                throw ApiError.badRequest(`Invalid period format: ${period}. Use format like "30d", "4w", "6m", "1y"`);
        }
    }
}
