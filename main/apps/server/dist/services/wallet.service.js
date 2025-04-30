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
exports.WalletService = void 0;
// import { prisma } from '../index.js'; // Removed
// import { ethers } from 'ethers'; // Ethers might still be needed for other utils if not here
// import jwt from 'jsonwebtoken'; // Removed JWT
const config_js_1 = require("../config/config.js");
const axios_1 = __importDefault(require("axios"));
// import { getCurrentBlockNumber, getBlockTimestamp } from '../utils/blockchain.js';
class WalletService {
    /**
     * Gets information about a wallet derived directly from blockchain data.
     * @param walletAddress The address of the wallet
     * @returns Wallet info object (derived on-the-fly)
     */
    getWalletInfo(walletAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Get balance and other wallet info from Blockscout
                const balanceResponse = yield axios_1.default.get(`${config_js_1.config.rootstockApi.url}/api?module=account&action=balance&address=${walletAddress}`, {
                    headers: config_js_1.config.rootstockApi.apiKey ? { 'api-key': config_js_1.config.rootstockApi.apiKey } : {},
                    timeout: 5000
                });
                // Use fallback if API fails
                if (balanceResponse.data.status !== '1') {
                    return this.generateFallbackWalletInfo(walletAddress);
                }
                const balance = balanceResponse.data.result || '0';
                // You could add more API calls here to gather additional wallet info
                return {
                    address: walletAddress,
                    balance: balance,
                    walletAge: 365, // Default for now
                    lastActivity: new Date()
                };
            }
            catch (error) {
                console.error(`Error fetching wallet info for ${walletAddress}:`, error);
                return this.generateFallbackWalletInfo(walletAddress);
            }
        });
    }
    // Add fallback method for wallet info
    generateFallbackWalletInfo(address) {
        return {
            address: address,
            balance: '0',
            walletAge: 365, // Default value
            lastActivity: new Date(),
            isFallback: true
        };
    }
    /**
     * Gets a list of all registered wallets
     * @returns Array of wallet objects
     */
    getAllWallets() {
        return __awaiter(this, void 0, void 0, function* () {
            // Removed getAllWallets method as it relied on Prisma
            return []; // Placeholder return, actual implementation needed
        });
    }
}
exports.WalletService = WalletService;
//# sourceMappingURL=wallet.service.js.map