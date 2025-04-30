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
const wallet_service_js_1 = require("../services/wallet.service.js");
const api_error_js_1 = require("../utils/api-error.js");
const blockchain_js_1 = require("../utils/blockchain.js");
// import { config } from '../config/config.js'; // No longer needed for JWT expiry
class WalletController {
    constructor() {
        this.walletService = new wallet_service_js_1.WalletService();
        // Bind methods
        this.getInfo = this.getInfo.bind(this);
        this.getAll = this.getAll.bind(this);
        this.verifyWallet = this.verifyWallet.bind(this);
    }
    /**
     * @description Get information about a specific wallet
     * @route GET /api/wallet/:address
     */
    getInfo(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { address } = req.params;
                const info = yield this.walletService.getWalletInfo(address);
                res.status(200).json(info);
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
    * @description Get all registered wallets (currently returns empty array)
    * @route GET /api/wallet/
    */
    getAll(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Note: Service method currently returns []
                const wallets = yield this.walletService.getAllWallets();
                res.status(200).json(wallets);
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * Verifies wallet ownership via signature.
     * In a stateless setup, this might be called before sensitive actions
     * if not relying on middleware for every request.
     */
    verifyWallet(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { address, message, signature } = req.body;
                if (!address || !message || !signature) {
                    throw new api_error_js_1.ApiError(400, 'Address, message, and signature are required');
                }
                // Verify that the signature is valid
                const isValid = (0, blockchain_js_1.verifySignature)(address, message, signature);
                if (!isValid) {
                    throw new api_error_js_1.ApiError(401, 'Invalid signature'); // 401 Unauthorized
                }
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
    }
}
exports.WalletController = WalletController;
//# sourceMappingURL=wallet.controller.js.map