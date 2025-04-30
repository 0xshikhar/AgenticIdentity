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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletController = void 0;
const wallet_service_1 = require("../services/wallet.service");
const api_error_1 = require("../utils/api-error");
const blockchain_1 = require("../utils/blockchain");
// import { config } from '../config/config'; // No longer needed for JWT expiry
class WalletController {
    constructor() {
        this.getWalletInfo = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { walletAddress } = req.params;
                if (!(0, blockchain_1.validateAddress)(walletAddress)) {
                    throw api_error_1.ApiError.badRequest('Invalid wallet address format');
                }
                const walletInfo = yield this.walletService.getWalletInfo(walletAddress);
                res.status(200).json({ success: true, data: walletInfo });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Verifies wallet ownership via signature.
         * In a stateless setup, this might be called before sensitive actions
         * if not relying on middleware for every request.
         */
        this.verifyWallet = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { address, message, signature } = req.body;
                if (!address || !message || !signature) {
                    throw api_error_1.ApiError.badRequest('Address, message, and signature are required');
                }
                if (!(0, blockchain_1.validateAddress)(address)) {
                    throw api_error_1.ApiError.badRequest('Invalid wallet address format');
                }
                // Verify that the signature is valid
                const isValid = (0, blockchain_1.verifySignature)(address, message, signature);
                if (!isValid) {
                    throw api_error_1.ApiError.unauthorized('Invalid signature'); // Use 401 Unauthorized
                }
                // Optionally update last login time or perform other actions upon verification
                // await this.walletService.recordSuccessfulVerification(address);
                // No JWT is returned
                res.status(200).json({
                    success: true,
                    message: 'Wallet verified successfully'
                });
            }
            catch (error) {
                next(error);
            }
        });
        /**
         * Registers a wallet after verifying ownership via signature.
         */
        this.registerWallet = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { address, signature, message } = req.body;
                if (!address || !signature || !message) {
                    throw api_error_1.ApiError.badRequest('Address, signature, and message are required');
                }
                if (!(0, blockchain_1.validateAddress)(address)) {
                    throw api_error_1.ApiError.badRequest('Invalid wallet address format');
                }
                // Verify the signature first
                const isValid = (0, blockchain_1.verifySignature)(address, message, signature);
                if (!isValid) {
                    throw api_error_1.ApiError.unauthorized('Invalid signature'); // Use 401 Unauthorized
                }
                // Register the wallet (sets isRegistered = true)
                const result = yield this.walletService.registerWallet(address);
                // No JWT is returned
                res.status(201).json({
                    success: true,
                    message: 'Wallet registered successfully',
                    data: {
                        wallet: result // Return the updated wallet record
                    }
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.walletService = new wallet_service_1.WalletService();
    }
}
exports.WalletController = WalletController;
//# sourceMappingURL=wallet.controller.js.map