// server/src/services/transaction.service.ts
// import { prisma } from '../index.js'; // Removed
import { ApiError } from '../utils/api-error.js';
import { fetchTransactions } from '../utils/blockchain.js'; // Keep this
// import { TransactionStats } from '../utils/score-calculator.js'; // Keep if score calculation still needs it
import axios from 'axios';
import { config } from '../config/config.js';
export class TransactionService {

    /**
     * Gets transactions directly from the blockchain API.
     * Note: Pagination/sorting might be limited by the API or require in-memory processing.
     */
    async getWalletTransactions(walletAddress: string, page: number = 1, pageSize: number = 20) {
        try {
            // Use original wallet address directly
            const transactions = await this.fetchTransactionsFromBlockscout(walletAddress, page, pageSize);
            
            // Process transactions as needed
            return {
                data: transactions,
                pagination: {
                    page,
                    pageSize,
                    totalCount: transactions.length, // Adjust if API provides total count
                }
            };
        } catch (error) {
            console.error(`Error fetching transactions for ${walletAddress}:`, error);
            throw error;
        }
    }

    private async fetchTransactionsFromBlockscout(walletAddress: string, page: number, pageSize: number) {
        try {
            // Fix the URL format - ensure no double slashes and add other params similar to your curl example
            const baseUrl = config.rootstockApi.url.replace(/\/+$/, ''); // Remove trailing slashes
            const url = `${baseUrl}/api?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999`;
            
            // Add API key if available 
            const apiKey = config.rootstockApi.apiKey;
            const apiKeyParam = apiKey ? `&apikey=${apiKey}` : '';
            
            const fullUrl = `${url}${apiKeyParam}`;
            console.log(`Fetching transactions from Blockscout: ${fullUrl}`);
            console.log('walletAddress', walletAddress);
            
            const response = await axios.get(fullUrl, {
                timeout: 15000 // Increased timeout for blockchain API
            });
            
            console.log('Blockscout response status:', response.data.status);
            if (response.data.status !== '1') {
                console.error('Blockscout API Error (txlist):', response.data.message, response.data.result);
                throw new Error(`Blockscout API Error: ${response.data.message || 'Failed to fetch transactions'}`);
            }
            
            return response.data.result || [];
        } catch (error: any) {
            console.error('Error fetching transactions from Blockscout:', error?.message);
            throw new ApiError(500, `Blockscout API request failed: ${error?.message}`);
        }
    }

    // Removed syncWalletTransactions method as it relied on Prisma

    // Removed getTransactionStats method if it relied solely on Prisma aggregates

    /**
     * Gets details for a specific transaction hash directly from the API.
     * Note: This might require a different API endpoint or filtering the list.
     */
    async getTransactionDetails(transactionHash: string) {
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

        throw new ApiError(501, 'getTransactionDetails not implemented without database/dedicated API endpoint');
    }
}
