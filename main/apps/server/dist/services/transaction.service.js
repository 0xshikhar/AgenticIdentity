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
exports.TransactionService = void 0;
// server/src/services/transaction.service.ts
// import { prisma } from '../index.js'; // Removed
const api_error_js_1 = require("../utils/api-error.js");
// import { TransactionStats } from '../utils/score-calculator.js'; // Keep if score calculation still needs it
const axios_1 = __importDefault(require("axios"));
const config_js_1 = require("../config/config.js");
class TransactionService {
    /**
     * Gets transactions directly from the blockchain API.
     * Note: Pagination/sorting might be limited by the API or require in-memory processing.
     */
    getWalletTransactions(walletAddress_1) {
        return __awaiter(this, arguments, void 0, function* (walletAddress, page = 1, pageSize = 20) {
            try {
                // Use original wallet address directly
                const transactions = yield this.fetchTransactionsFromBlockscout(walletAddress, page, pageSize);
                // Process transactions as needed
                return {
                    data: transactions,
                    pagination: {
                        page,
                        pageSize,
                        totalCount: transactions.length, // Adjust if API provides total count
                    }
                };
            }
            catch (error) {
                console.error(`Error fetching transactions for ${walletAddress}:`, error);
                throw error;
            }
        });
    }
    fetchTransactionsFromBlockscout(walletAddress, page, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Fix the URL format - ensure no double slashes and add other params similar to your curl example
                const baseUrl = config_js_1.config.rootstockApi.url.replace(/\/+$/, ''); // Remove trailing slashes
                const url = `${baseUrl}/api?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999`;
                // Add API key if available 
                const apiKey = config_js_1.config.rootstockApi.apiKey;
                const apiKeyParam = apiKey ? `&apikey=${apiKey}` : '';
                const fullUrl = `${url}${apiKeyParam}`;
                console.log(`Fetching transactions from Blockscout: ${fullUrl}`);
                console.log('walletAddress', walletAddress);
                const response = yield axios_1.default.get(fullUrl, {
                    timeout: 15000 // Increased timeout for blockchain API
                });
                console.log('Blockscout response status:', response.data.status);
                if (response.data.status !== '1') {
                    console.error('Blockscout API Error (txlist):', response.data.message, response.data.result);
                    throw new Error(`Blockscout API Error: ${response.data.message || 'Failed to fetch transactions'}`);
                }
                return response.data.result || [];
            }
            catch (error) {
                console.error('Error fetching transactions from Blockscout:', error === null || error === void 0 ? void 0 : error.message);
                throw new api_error_js_1.ApiError(500, `Blockscout API request failed: ${error === null || error === void 0 ? void 0 : error.message}`);
            }
        });
    }
    // Removed syncWalletTransactions method as it relied on Prisma
    // Removed getTransactionStats method if it relied solely on Prisma aggregates
    /**
     * Gets details for a specific transaction hash directly from the API.
     * Note: This might require a different API endpoint or filtering the list.
     */
    getTransactionDetails(transactionHash) {
        return __awaiter(this, void 0, void 0, function* () {
            // Option 1: Fetch all transactions for related wallets and filter (inefficient)
            // Option 2: Use a specific API endpoint if available (e.g., getTransactionByHash)
            // Option 3: For MVP, maybe this isn't needed if details are in the list view
            // Placeholder: Assuming you might need to fetch from a list and find it
            // This is NOT efficient and depends on knowing a related wallet address
            console.warn("getTransactionDetails without DB requires fetching lists or a dedicated API endpoint.");
            // Example (inefficient): Fetch from a known wallet and filter
            // const relatedWallet = '...'; // Need a way to know which wallet list to check
            // const { data } = await this.getWalletTransactions(relatedWallet, 1, 1000); // Fetch a large page
            // const transaction = data.find(tx => tx.hash === transactionHash);
            // if (!transaction) {
            //     throw new ApiError(404, 'Transaction not found (requires efficient lookup method)');
            // }
            // return transaction;
            throw new api_error_js_1.ApiError(501, 'getTransactionDetails not implemented without database/dedicated API endpoint');
        });
    }
}
exports.TransactionService = TransactionService;
//# sourceMappingURL=transaction.service.js.map