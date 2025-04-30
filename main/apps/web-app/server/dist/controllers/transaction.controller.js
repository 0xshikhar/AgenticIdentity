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
exports.TransactionController = void 0;
const transaction_service_1 = require("../services/transaction.service");
const api_error_1 = require("../utils/api-error");
const blockchain_1 = require("../utils/blockchain");
class TransactionController {
    constructor() {
        this.getTransactions = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { walletAddress } = req.params;
                const { page = '1', limit = '20', sort = 'desc' } = req.query;
                if (!(0, blockchain_1.validateAddress)(walletAddress)) {
                    throw api_error_1.ApiError.badRequest('Invalid wallet address format');
                }
                const transactions = yield this.transactionService.getWalletTransactions(walletAddress, parseInt(page), parseInt(limit), sort);
                res.status(200).json({ success: true, data: transactions });
            }
            catch (error) {
                next(error);
            }
        });
        this.getTransactionStats = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { walletAddress } = req.params;
                const { period } = req.query;
                if (!(0, blockchain_1.validateAddress)(walletAddress)) {
                    throw api_error_1.ApiError.badRequest('Invalid wallet address format');
                }
                const stats = yield this.transactionService.getTransactionStats(walletAddress, period || '30d');
                res.status(200).json({ success: true, data: stats });
            }
            catch (error) {
                next(error);
            }
        });
        this.analyzeTransactions = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { walletAddress, period } = req.body;
                if (!walletAddress) {
                    throw api_error_1.ApiError.badRequest('Wallet address is required');
                }
                if (!(0, blockchain_1.validateAddress)(walletAddress)) {
                    throw api_error_1.ApiError.badRequest('Invalid wallet address format');
                }
                const analysis = yield this.transactionService.analyzeTransactions(walletAddress, period || '30d');
                res.status(200).json({ success: true, data: analysis });
            }
            catch (error) {
                next(error);
            }
        });
        this.syncWalletTransactions = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { walletAddress } = req.params;
                if (!(0, blockchain_1.validateAddress)(walletAddress)) {
                    throw api_error_1.ApiError.badRequest('Invalid wallet address format');
                }
                const syncJob = yield this.transactionService.syncWalletTransactions(walletAddress);
                if (!syncJob.success) {
                    throw new api_error_1.ApiError(500, syncJob.message || 'Transaction sync failed');
                }
                res.status(202).json({
                    success: true,
                    message: syncJob.message || 'Transaction sync job started',
                    jobId: syncJob.id || null
                });
            }
            catch (error) {
                next(error);
            }
        });
        this.transactionService = new transaction_service_1.TransactionService();
    }
}
exports.TransactionController = TransactionController;
//# sourceMappingURL=transaction.controller.js.map