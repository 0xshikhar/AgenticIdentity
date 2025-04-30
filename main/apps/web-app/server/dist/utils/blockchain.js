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
exports.validateAddress = validateAddress;
exports.verifySignature = verifySignature;
exports.fetchTransactions = fetchTransactions;
exports.getCurrentBlockNumber = getCurrentBlockNumber;
exports.getBlockTimestamp = getBlockTimestamp;
const ethers_1 = require("ethers");
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config/config");
/**
 * Validates an Ethereum address format
 * @param address The address to validate
 * @returns True if the address is valid, false otherwise
 */
function validateAddress(address) {
    try {
        // Check if it's a valid Ethereum address
        return ethers_1.ethers.utils.isAddress(address);
    }
    catch (error) {
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
function verifySignature(address, message, signature) {
    try {
        // Recover the address from the signature and message
        const signerAddress = ethers_1.ethers.utils.verifyMessage(message, signature);
        // Check if the recovered address matches the claimed address
        return signerAddress.toLowerCase() === address.toLowerCase();
    }
    catch (error) {
        console.error('Signature verification error:', error);
        return false;
    }
}
/**
 * Fetches transactions for a given wallet address from the blockchain
 * @param address The wallet address to fetch transactions for
 * @returns Array of transaction objects
 */
function fetchTransactions(address) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const url = `${config_1.config.rootstockApi.url}/api?module=account&action=txlist&address=${address}`;
            const headers = {};
            if (config_1.config.rootstockApi.apiKey) {
                headers['X-API-Key'] = config_1.config.rootstockApi.apiKey;
            }
            const response = yield axios_1.default.get(url, { headers });
            if (response.data.status !== '1') {
                throw new Error(`API Error: ${response.data.message}`);
            }
            return response.data.result;
        }
        catch (error) {
            console.error('Error fetching transactions:', error);
            throw error;
        }
    });
}
/**
 * Gets the current block number from the blockchain
 * @returns The current block number
 */
function getCurrentBlockNumber() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const provider = new ethers_1.ethers.providers.JsonRpcProvider(config_1.config.rskNode.url);
            return yield provider.getBlockNumber();
        }
        catch (error) {
            console.error('Error getting block number:', error);
            throw error;
        }
    });
}
/**
 * Gets the timestamp of a specific block
 * @param blockNumber The block number to get the timestamp for
 * @returns The timestamp of the block in milliseconds
 */
function getBlockTimestamp(blockNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const provider = new ethers_1.ethers.providers.JsonRpcProvider(config_1.config.rskNode.url);
            const block = yield provider.getBlock(blockNumber);
            return block.timestamp * 1000; // Convert to milliseconds
        }
        catch (error) {
            console.error('Error getting block timestamp:', error);
            throw error;
        }
    });
}
//# sourceMappingURL=blockchain.js.map