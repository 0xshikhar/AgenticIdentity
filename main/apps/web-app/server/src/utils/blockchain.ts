import { ethers } from 'ethers';
import axios from 'axios';
import { config } from '../config/config';

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

/**
 * Fetches transactions for a given wallet address from the blockchain
 * @param address The wallet address to fetch transactions for
 * @returns Array of transaction objects
 */
export async function fetchTransactions(address: string) {
    try {
        const url = `${config.rootstockApi.url}/api?module=account&action=txlist&address=${address}`;
        
        const headers: Record<string, string> = {};
        if (config.rootstockApi.apiKey) {
            headers['X-API-Key'] = config.rootstockApi.apiKey;
        }
        
        const response = await axios.get(url, { headers });
        
        if (response.data.status !== '1') {
            throw new Error(`API Error: ${response.data.message}`);
        }
        
        return response.data.result;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        throw error;
    }
}

/**
 * Gets the current block number from the blockchain
 * @returns The current block number
 */
export async function getCurrentBlockNumber(): Promise<number> {
    try {
        const provider = new ethers.providers.JsonRpcProvider(config.rskNode.url);
        return await provider.getBlockNumber();
    } catch (error) {
        console.error('Error getting block number:', error);
        throw error;
    }
}

/**
 * Gets the timestamp of a specific block
 * @param blockNumber The block number to get the timestamp for
 * @returns The timestamp of the block in milliseconds
 */
export async function getBlockTimestamp(blockNumber: number): Promise<number> {
    try {
        const provider = new ethers.providers.JsonRpcProvider(config.rskNode.url);
        const block = await provider.getBlock(blockNumber);
        return block.timestamp * 1000; // Convert to milliseconds
    } catch (error) {
        console.error('Error getting block timestamp:', error);
        throw error;
    }
} 