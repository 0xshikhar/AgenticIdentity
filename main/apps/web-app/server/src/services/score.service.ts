// server/src/services/score.service.ts
import { prisma } from '../index';
import { config } from '../config/config';
import { ApiError } from '../utils/api-error';
import { TransactionService } from './transaction.service';
import { WalletService } from './wallet.service';
import { calculateReputationScore, TransactionStats, WalletInfo, ScoreWeights } from '../utils/score-calculator';

export class ScoreService {
    private transactionService: TransactionService;
    private walletService: WalletService;

    constructor() {
        this.transactionService = new TransactionService();
        this.walletService = new WalletService();
    }

    async getReputationScore(walletAddress: string) {
        const normalizedAddress = walletAddress.toLowerCase();
        // Check cache first
        const latestScore = await prisma.reputationScore.findFirst({
            where: { walletAddress: normalizedAddress },
            orderBy: { timestamp: 'desc' }
        });

        if (latestScore && this.isScoreValid(latestScore.timestamp)) {
            try {
                return {
                    score: latestScore.score,
                    timestamp: latestScore.timestamp,
                    factors: JSON.parse(latestScore.factors || '[]'),
                    isCached: true
                };
            } catch (e) {
                console.error("Failed to parse cached score factors:", e);
                // Proceed to recalculate if parsing fails
            }
        }

        // Otherwise, calculate a new score
        return this.calculateReputationScore(normalizedAddress);
    }

    async getScoreHistory(walletAddress: string, period: string) {
        const normalizedAddress = walletAddress.toLowerCase();
        const duration = this.parseDuration(period);
        const startDate = new Date();
        startDate.setTime(startDate.getTime() - duration);

        const scores = await prisma.reputationScore.findMany({
            where: {
                walletAddress: normalizedAddress,
                timestamp: { gte: startDate }
            },
            orderBy: { timestamp: 'asc' }
        });

        // Format the scores for response, ensuring factors are parsed safely
        return scores.map((score: any) => {
            let factors = [];
            try {
                factors = JSON.parse(score.factors || '[]');
            } catch (e) {
                console.error(`Failed to parse factors for score ${score.id}:`, e);
            }
            return {
                score: score.score,
                timestamp: score.timestamp,
                factors: factors
            };
        });
    }

    async calculateReputationScore(walletAddress: string, forceRefresh: boolean = false) {
        const normalizedAddress = walletAddress.toLowerCase();

        // Check cache again if not forcing refresh
        if (!forceRefresh) {
            const latestScore = await prisma.reputationScore.findFirst({
                where: { walletAddress: normalizedAddress },
                orderBy: { timestamp: 'desc' }
            });
            if (latestScore && this.isScoreValid(latestScore.timestamp)) {
                try {
                    return {
                        score: latestScore.score,
                        timestamp: latestScore.timestamp,
                        factors: JSON.parse(latestScore.factors || '[]'),
                        isCached: true
                    };
                } catch (e) {
                    console.error("Failed to parse cached score factors during calculation:", e);
                }
            }
        }

        console.log(`Calculating score for ${normalizedAddress}...`);
        // Get wallet info and transaction history
        const walletInfo: WalletInfo = await this.walletService.getWalletInfo(normalizedAddress);
        const rawTransactionStats = await this.transactionService.getTransactionStats(normalizedAddress, 'all');

        // Add missing properties required by TransactionStats interface
        const transactionStats: TransactionStats = {
            ...rawTransactionStats,
            uniqueRecipients: rawTransactionStats.uniqueContacts || 0,
            isAllTime: rawTransactionStats.period === 'all',
            // Handle potentially null averageTransactionsPerDay
            averageTransactionsPerDay: rawTransactionStats.averageTransactionsPerDay || 0
        };

        // Calculate the score
        const { score, factors } = calculateReputationScore(walletInfo, transactionStats, config.scoreConfig.weights);

        // Save the score to the database
        const savedScore = await prisma.reputationScore.create({
            data: {
                walletAddress: normalizedAddress,
                score,
                factors: JSON.stringify(factors),
                timestamp: new Date()
            }
        });

        return {
            score: savedScore.score,
            timestamp: savedScore.timestamp,
            factors: JSON.parse(savedScore.factors || '[]'),
            isCached: false
        };
    }

    async recalculateAllScores() {
        // Get all wallets that have transactions
        const wallets = await prisma.wallet.findMany();
        const results = {
            total: wallets.length,
            processed: 0,
            success: 0,
            failed: 0,
            errors: [] as string[]
        };

        for (const wallet of wallets) {
            try {
                await this.calculateReputationScore(wallet.address, true);
                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push(`Error calculating score for ${wallet.address}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            } finally {
                results.processed++;
            }
        }

        return results;
    }

    async updateScoreConfig(weights: ScoreWeights) {
        // Validate weights
        if (!weights) {
            throw ApiError.badRequest('Weights are required');
        }

        // Check if all required weights are present
        const requiredWeights = [
            'walletAge',
            'transactionVolume',
            'transactionFrequency',
            'contractInteractions',
            'networkDiversity',
            'stakingHistory'
        ];

        for (const weight of requiredWeights) {
            if (!(weight in weights)) {
                throw ApiError.badRequest(`Missing required weight: ${weight}`);
            }
        }

        // Check if weights sum to 1 (use Number for sum)
        const sum = Object.values(weights).reduce((a: number, b: number) => a + b, 0 as number);
        if (Math.abs(sum - 1) > 0.001) {
            throw ApiError.badRequest(`Weights must sum to 1 (current sum: ${sum})`);
        }

        // Update config
        config.scoreConfig.weights = weights;

        // Optionally persist to database or config file
        // await persistConfig(config);

        return config.scoreConfig;
    }

    // Helper methods
    private isScoreValid(timestamp: Date): boolean {
        const now = new Date();
        const scoreAge = now.getTime() - timestamp.getTime();
        return scoreAge < config.scoreConfig.cacheDuration;
    }

    private parseDuration(period: string): number {
        const value = parseInt(period.slice(0, -1));
        const unit = period.slice(-1).toLowerCase();

        switch (unit) {
            case 'd': return value * 24 * 60 * 60 * 1000;
            case 'w': return value * 7 * 24 * 60 * 60 * 1000;
            case 'm': return value * 30 * 24 * 60 * 60 * 1000; // Approx
            case 'y': return value * 365 * 24 * 60 * 60 * 1000; // Approx
            default:
                throw ApiError.badRequest(`Invalid period format: ${period}. Use format like "30d", "4w", "6m", "1y" or "all"`);
        }
    }

    async storeScore(walletAddress: string, score: number): Promise<void> {
        await prisma.reputationScore.create({
            data: {
                walletAddress: walletAddress.toLowerCase(),
                score,
                factors: '[]', // Empty factors for manually stored scores
                timestamp: new Date()
            }
        });
    }

    /**
     * Gets an AI-generated reputation score for a wallet
     * @param walletAddress The address to get a score for
     * @returns AI-generated score data
     */
    async getAIGeneratedScore(walletAddress: string): Promise<any> {
        try {
            // Normalize the address
            const normalizedAddress = walletAddress.toLowerCase();
            
            // Get wallet and transaction data to feed to the AI
            const walletInfo = await this.walletService.getWalletInfo(normalizedAddress);
            const rawTransactionStats = await this.transactionService.getTransactionStats(normalizedAddress, 'all');
            
            // Initialize the AI score generator (would be implemented in a separate module)
            // For now, we'll provide a simulated implementation
            
            console.log(`Generating AI score for ${normalizedAddress}...`);
            
            // Simulate AI processing time
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Calculate a base score using our standard method for reference
            const transactionStats: TransactionStats = {
                ...rawTransactionStats,
                uniqueRecipients: rawTransactionStats.uniqueContacts || 0,
                isAllTime: rawTransactionStats.period === 'all',
                // Handle potentially null averageTransactionsPerDay
                averageTransactionsPerDay: rawTransactionStats.averageTransactionsPerDay || 0
            };
            
            const standardScore = calculateReputationScore(
                walletInfo,
                transactionStats,  
                config.scoreConfig.weights
            );
            
            // Add some AI-specific additional factors
            const additionalFactors = [
                {
                    name: 'Network Reputation',
                    value: Math.random() * 100, // Would come from AI model
                    score: Math.random() * 100,  // Would come from AI model
                    contribution: Math.random() * 10, // Would come from AI model
                    description: 'Reputation derived from network analysis'
                },
                {
                    name: 'Activity Pattern',
                    value: Math.random() * 100,
                    score: Math.random() * 100,
                    contribution: Math.random() * 5,
                    description: 'Analysis of transaction timing and patterns'
                }
            ];
            
            // Simulate an AI-adjusted score (±15% from standard)
            const adjustment = (Math.random() * 0.3) - 0.15; // Between -15% and +15%
            const aiScore = Math.round(standardScore.score * (1 + adjustment));
            
            // Clamp to 0-100 range
            const finalScore = Math.max(0, Math.min(100, aiScore));
            
            return {
                score: finalScore,
                confidence: 0.7 + (Math.random() * 0.2), // 0.7-0.9 confidence range
                factors: [...standardScore.factors, ...additionalFactors],
                updated: new Date(),
                isAIGenerated: true
            };
        } catch (error) {
            console.error(`Error generating AI score for ${walletAddress}:`, error);
            
            // Fall back to standard score calculation
            return this.calculateReputationScore(walletAddress, true);
        }
    }

    /**
     * Gets an enhanced reputation score combining standard and AI methods
     * @param walletAddress The address to get a score for
     * @returns Enhanced reputation score data
     */
    async getEnhancedReputationScore(walletAddress: string): Promise<any> {
        // Get both scores in parallel for efficiency
        const standardScorePromise = this.getReputationScore(walletAddress);
        const aiScorePromise = this.getAIGeneratedScore(walletAddress);
        
        try {
            const [standardScore, aiScore] = await Promise.all([
                standardScorePromise,
                aiScorePromise
            ]);
            
            // Check if AI score generation fell back to standard calculation
            if (aiScore.isAIGenerated !== true) {
                console.log(`AI score fallback detected for ${walletAddress}, returning standard score.`);
                return standardScore; // AI failed, return standard
            }
            
            // Combine the scores with appropriate weighting
            const combinedScore = Math.round(
                (standardScore.score * 0.7) + (aiScore.score * 0.3) // Example weighting
            );
            
            // Combine factors from both scoring systems
            const combinedFactors = [
                ...(standardScore.factors || []),
                ...(aiScore.factors || [])
                    .filter((f: any) => f.name.indexOf('AI:') !== 0) // Avoid duplicate factors
                    .map((f: any) => ({
                        name: `AI: ${f.name}`,
                        value: f.value,
                        score: f.score,
                        contribution: f.contribution * 0.3, // Scale contribution by AI weight
                        description: f.description
                    }))
            ].sort((a, b) => (b.contribution || 0) - (a.contribution || 0));
            
            return {
                score: combinedScore,
                standardScore: standardScore.score,
                aiScore: aiScore.score,
                timestamp: new Date(),
                factors: combinedFactors,
                confidence: aiScore.confidence || 0.8,
                isCached: false,
                isEnhanced: true
            };
        } catch (error) {
            // If any part fails, log and return just the standard score
            console.error(`Enhanced scoring failed for ${walletAddress}:`, error);
            return standardScorePromise;
        }
    }

    // AI-related methods remain the same
}
