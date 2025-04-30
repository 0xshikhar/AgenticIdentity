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
exports.fetchBalance = fetchBalance;
exports.fetchTokenTransfers = fetchTokenTransfers;
exports.fetchTokenBalance = fetchTokenBalance;
exports.fetchInternalTransactions = fetchInternalTransactions;
const ethers_1 = require("ethers");
const axios_1 = __importDefault(require("axios"));
const config_js_1 = require("../config/config.js");
const api_error_js_1 = require("./api-error.js");
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
// Add interfaces for TokenTransfer, TokenBalance, InternalTransaction if needed
const blockscoutApi = axios_1.default.create({
    baseURL: config_js_1.config.rootstockApi.url,
    params: {
        apikey: config_js_1.config.rootstockApi.apiKey // Add API key globally
    }
});
/**
 * Fetches the list of normal transactions for a given wallet address.
 * Corresponds to action=txlist
 */
function fetchTransactions(walletAddress_1) {
    return __awaiter(this, arguments, void 0, function* (walletAddress, page = 1, offset = 10, // Default offset as per README example
    sort = 'asc' // Default sort as per README example
    ) {
        var _a, _b, _c, _d;
        try {
            const response = yield blockscoutApi.get('', {
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
                throw new api_error_js_1.ApiError(502, `Blockscout API Error: ${response.data.message || 'Failed to fetch transactions'}`);
            }
            // Ensure result is always an array, even if API returns null/undefined on no results
            return response.data.result || [];
        }
        catch (error) {
            console.error('Error fetching transactions from Blockscout:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message, "walletAddress", walletAddress);
            const status = ((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) || 500;
            const message = ((_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.message) || error.message || 'Failed to connect to Blockscout API';
            throw new api_error_js_1.ApiError(status, `Blockscout API request failed: ${message}`);
        }
    });
}
/**
 * Fetches the account balance for a given wallet address.
 * Corresponds to action=balance
 */
function fetchBalance(walletAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        try {
            const response = yield blockscoutApi.get('', {
                params: {
                    module: 'account',
                    action: 'balance',
                    address: walletAddress,
                    // tag: 'latest' // Usually default, add if needed
                }
            });
            if (response.data.status !== '1' || response.data.message !== 'OK') {
                console.error('Blockscout API Error (balance):', response.data.message, response.data.result);
                throw new api_error_js_1.ApiError(502, `Blockscout API Error: ${response.data.message || 'Failed to fetch balance'}`);
            }
            return response.data.result;
        }
        catch (error) {
            console.error('Error fetching balance from Blockscout:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
            const status = ((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) || 500;
            const message = ((_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.message) || error.message || 'Failed to connect to Blockscout API';
            throw new api_error_js_1.ApiError(status, `Blockscout API request failed: ${message}`);
        }
    });
}
// --- Placeholder functions for other API calls from README ---
// You can implement these similarly if/when needed by your services
/**
 * Fetches token transfers (action=tokentx).
 * Implementation needed if required.
 */
function fetchTokenTransfers(walletAddress_1, contractAddress_1) {
    return __awaiter(this, arguments, void 0, function* (walletAddress, contractAddress, page = 1, offset = 10, sort = 'asc') {
        console.warn("fetchTokenTransfers not fully implemented");
        // Implementation similar to fetchTransactions, adjust params:
        // module=account, action=tokentx, address=walletAddress, contractaddress=contractAddress (optional?)
        // page, offset, sort
        return []; // Placeholder
    });
}
/**
 * Fetches token balance for a specific ERC-20 token (action=tokenbalance).
 * Implementation needed if required.
 */
function fetchTokenBalance(walletAddress, contractAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        console.warn("fetchTokenBalance not fully implemented");
        // Implementation similar to fetchBalance, adjust params:
        // module=account, action=tokenbalance, address=walletAddress, contractaddress=contractAddress
        // tag=latest (usually default)
        return "0"; // Placeholder
    });
}
/**
 * Fetches internal transactions (action=txlistinternal).
 * Implementation needed if required.
 */
function fetchInternalTransactions(walletAddress_1) {
    return __awaiter(this, arguments, void 0, function* (walletAddress, page = 1, offset = 10, sort = 'asc') {
        console.warn("fetchInternalTransactions not fully implemented");
        // Implementation similar to fetchTransactions, adjust params:
        // module=account, action=txlistinternal, address=walletAddress
        // startblock, endblock, page, offset, sort
        return []; // Placeholder
    });
}
// --- Keep existing utility functions if needed ---
// export async function getCurrentBlockNumber() { ... }
// export async function getBlockTimestamp(blockNumber: number) { ... } 
//# sourceMappingURL=blockchain.js.map