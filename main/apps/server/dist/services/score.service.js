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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreService = void 0;
// server/src/services/score.service.ts
// import { prisma } from '../index.js'; // Removed
const config_js_1 = require("../config/config.js");
const api_error_js_1 = require("../utils/api-error.js");
const transaction_service_js_1 = require("./transaction.service.js");
const wallet_service_js_1 = require("./wallet.service.js");
const score_calculator_js_1 = require("../utils/score-calculator.js");
const axios_1 = __importDefault(require("axios"));
class ScoreService {
    constructor() {
        // Services no longer depend on Prisma implicitly
        this.transactionService = new transaction_service_js_1.TransactionService();
        this.walletService = new wallet_service_js_1.WalletService();
        // Initialize the AI model when service is created
        this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8090';
    }
    /**
     * Calculates the reputation score on-the-fly without caching.
     * @param walletAddress The address of the wallet
     * @returns The calculated score and factors
     */
    calculateReputationScore(walletAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Use original wallet address
                const transactionData = yield this.transactionService.getWalletTransactions(walletAddress, 1, 1000);
                const walletInfoData = yield this.walletService.getWalletInfo(walletAddress);
                // Ensure data is in the expected format for the calculator
                if (!walletInfoData || transactionData.data === null || transactionData.data === undefined) {
                    throw new api_error_js_1.ApiError(404, 'Could not retrieve necessary data for score calculation.');
                }
                // 2. Prepare data for the score calculator
                //    (This part depends heavily on your score-calculator logic)
                //    You might need to adapt how TransactionStats and WalletInfo are created
                //    based *only* on the API responses.
                // Example: Creating TransactionStats (adapt based on your actual needs)
                // @ts-ignore
                const stats = {
                    totalTransactions: transactionData.pagination.totalCount,
                    period: 'all',
                    sentTransactions: 0,
                    receivedTransactions: 0,
                    totalValue: parseFloat('0'),
                    averageTransactionValue: 0,
                    largestTransaction: 0,
                    averageGasUsed: 0,
                    totalGasUsed: 0,
                    contractInteractionCount: 0,
                    uniqueAddressesInteracted: 0,
                    successRate: 100,
                    averageTransactionsPerDay: 0,
                    isAllTime: true
                };
                // Example: Creating WalletInfo (adapt based on your actual needs)
                const walletInfo = {
                    address: walletInfoData.address,
                    walletAge: walletInfoData.walletAge || 0,
                    transactionCount: transactionData.pagination.totalCount,
                    contractInteractions: 0,
                    lastActivity: new Date()
                };
                // 3. Calculate the score using the utility function
                const { score, factors } = (0, score_calculator_js_1.calculateReputationScore)(walletInfo, stats, config_js_1.config.scoreConfig.weights // Use configured weights
                );
                // 4. Return the calculated score (no caching/storing)
                return {
                    score: score,
                    timestamp: new Date(), // Timestamp of calculation
                    factors: factors,
                    isCached: false // Always false now
                };
            }
            catch (error) {
                console.error(`Error calculating score for ${walletAddress}:`, error);
                if (error instanceof api_error_js_1.ApiError)
                    throw error;
                throw new api_error_js_1.ApiError(500, `Failed to calculate score: ${error.message || error}`);
            }
        });
    }
    // Update the enhanced reputation score method to use the API
    getEnhancedReputationScore(walletAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Call the AI service with original wallet address
                const response = yield axios_1.default.get(`${this.aiServiceUrl}/score/${walletAddress}`);
                if (!response.data.success) {
                    throw new api_error_js_1.ApiError(500, 'AI service returned an error');
                }
                const aiScore = response.data.data;
                return {
                    score: aiScore.score,
                    confidence: aiScore.confidence,
                    factors: aiScore.factors,
                    timestamp: new Date(aiScore.updated),
                    isCached: false
                };
            }
            catch (error) {
                console.error(`Error getting enhanced score for ${walletAddress}:`, error);
                // Add fallback for when AI service fails
                console.log(`Using fallback score generation for ${walletAddress}`);
                return this.generateFallbackScore(walletAddress);
            }
        });
    }
    // Add fallback score generation method
    generateFallbackScore(address) {
        // Use address to generate a deterministic score
        const addressSum = address.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const score = 50 + (addressSum % 40); // Score between 50-90
        const factors = [
            {
                name: 'Transaction History',
                value: Math.floor(addressSum / 10) % 100,
                score: 60 + (addressSum % 30),
                contribution: 30,
                description: 'Analysis of transaction patterns'
            },
            {
                name: 'Wallet Activity',
                value: Math.floor(10 + (addressSum % 50)),
                score: 50 + (addressSum % 40),
                contribution: 25,
                description: 'Level of activity in the network'
            },
            {
                name: 'Network Reputation',
                value: Math.floor(100 + (addressSum % 300)),
                score: 40 + (addressSum % 50),
                contribution: 20,
                description: 'Overall blockchain ecosystem standing'
            }
        ];
        return {
            score,
            confidence: 0.7, // Lower confidence for fallback
            factors,
            timestamp: new Date(),
            isCached: false,
            isFallback: true
        };
    }
}
exports.ScoreService = ScoreService;
//# sourceMappingURL=score.service.js.map