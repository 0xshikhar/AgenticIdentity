import { ethers } from 'ethers';
import axios from 'axios';
import { config } from '../config/config.js';
import { ApiError } from './api-error.js';

/**
 * Validates an Ethereum address format
 * @param address The address to validate
 * @returns True if the address is valid, false otherwise
 */
export function validateAddress(address: string): boolean {
    try {
        // Check if it's a valid Ethereum address
        return ethers.utils.isAddress(address);
    } catch (error) {
        return false;
    }
}

/**
 * Verifies that a signature is valid for a given message and address
 * @param address The address that supposedly signed the message
 * @param message The original message that was signed
 * @param signature The signature to verify
 * @returns True if the signature is valid, false otherwise
 */
export function verifySignature(address: string, message: string, signature: string): boolean {
    try {
        // Recover the address from the signature and message
        const signerAddress = ethers.utils.verifyMessage(message, signature);

        // Check if the recovered address matches the claimed address
        return signerAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
        console.error('Signature verification error:', error);
        return false;
    }
}

// Define interfaces for expected API responses (based on README)
interface BlockscoutApiResponse<T> {
    message: string;
    result: T;
    status: string; // Typically "1" for success, "0" for error
}

interface TransactionResult {
    blockHash: string;
    blockNumber: string;
    confirmations: string;
    contractAddress: string;
    cumulativeGasUsed: string;
    from: string;
    gas: string;
    gasPrice: string;
    gasUsed: string;
    hash: string;
    input: string;
    isError: string; // "0" or "1"
    nonce: string;
    timeStamp: string; // Unix timestamp string
    to: string;
    transactionIndex: string;
    txreceipt_status: string; // "1" for success
    value: string;
}

interface BalanceResult extends String { } // Balance is just a string number

// Add interfaces for TokenTransfer, TokenBalance, InternalTransaction if needed

const blockscoutApi = axios.create({
    baseURL: config.rootstockApi.url,
    params: {
        apikey: config.rootstockApi.apiKey // Add API key globally
    }
});

/**
 * Fetches the list of normal transactions for a given wallet address.
 * Corresponds to action=txlist
 */
export async function fetchTransactions(
    walletAddress: string,
    page: number = 1,
    offset: number = 10, // Default offset as per README example
    sort: 'asc' | 'desc' = 'asc' // Default sort as per README example
): Promise<TransactionResult[]> {
    try {
        const response = await blockscoutApi.get<BlockscoutApiResponse<TransactionResult[]>>('', {
            params: {
                module: 'account',
                action: 'txlist',
                address: walletAddress,
                startblock: 0, // As per README example
                endblock: 99999999, // As per README example
                page: page,
                offset: offset,
                sort: sort,
                // apikey is already added in axios instance defaults
            }
        });

        if (response.data.status !== '1' || response.data.message !== 'OK') {
            // Handle cases where API returns OK status but empty result or specific error messages
            if (response.data.message === 'No transactions found') {
                return []; // Return empty array if no transactions
            }
            console.error('Blockscout API Error (txlist):', response.data.message, response.data.result);
            throw new ApiError(502, `Blockscout API Error: ${response.data.message || 'Failed to fetch transactions'}`);
        }

        // Ensure result is always an array, even if API returns null/undefined on no results
        return response.data.result || [];

    } catch (error: any) {
        console.error('Error fetching transactions from Blockscout:', error.response?.data || error.message, "walletAddress", walletAddress);
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || error.message || 'Failed to connect to Blockscout API';
        throw new ApiError(status, `Blockscout API request failed: ${message}`);
    }
}

/**
 * Fetches the account balance for a given wallet address.
 * Corresponds to action=balance
 */
export async function fetchBalance(walletAddress: string): Promise<string> {
    try {
        const response = await blockscoutApi.get<BlockscoutApiResponse<BalanceResult>>('', {
            params: {
                module: 'account',
                action: 'balance',
                address: walletAddress,
                // tag: 'latest' // Usually default, add if needed
            }
        });

        if (response.data.status !== '1' || response.data.message !== 'OK') {
            console.error('Blockscout API Error (balance):', response.data.message, response.data.result);
            throw new ApiError(502, `Blockscout API Error: ${response.data.message || 'Failed to fetch balance'}`);
        }

        return (response.data.result as any);

    } catch (error: any) {
        console.error('Error fetching balance from Blockscout:', error.response?.data || error.message);
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || error.message || 'Failed to connect to Blockscout API';
        throw new ApiError(status, `Blockscout API request failed: ${message}`);
    }
}


// --- Placeholder functions for other API calls from README ---
// You can implement these similarly if/when needed by your services

/**
 * Fetches token transfers (action=tokentx).
 * Implementation needed if required.
 */
export async function fetchTokenTransfers(walletAddress: string, contractAddress?: string, page: number = 1, offset: number = 10, sort: 'asc' | 'desc' = 'asc') {
    console.warn("fetchTokenTransfers not fully implemented");
    // Implementation similar to fetchTransactions, adjust params:
    // module=account, action=tokentx, address=walletAddress, contractaddress=contractAddress (optional?)
    // page, offset, sort
    return []; // Placeholder
}

/**
 * Fetches token balance for a specific ERC-20 token (action=tokenbalance).
 * Implementation needed if required.
 */
export async function fetchTokenBalance(walletAddress: string, contractAddress: string) {
    console.warn("fetchTokenBalance not fully implemented");
    // Implementation similar to fetchBalance, adjust params:
    // module=account, action=tokenbalance, address=walletAddress, contractaddress=contractAddress
    // tag=latest (usually default)
    return "0"; // Placeholder
}

/**
 * Fetches internal transactions (action=txlistinternal).
 * Implementation needed if required.
 */
export async function fetchInternalTransactions(walletAddress: string, page: number = 1, offset: number = 10, sort: 'asc' | 'desc' = 'asc') {
    console.warn("fetchInternalTransactions not fully implemented");
    // Implementation similar to fetchTransactions, adjust params:
    // module=account, action=txlistinternal, address=walletAddress
    // startblock, endblock, page, offset, sort
    return []; // Placeholder
}


// --- Keep existing utility functions if needed ---
// export async function getCurrentBlockNumber() { ... }
// export async function getBlockTimestamp(blockNumber: number) { ... } 