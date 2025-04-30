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
const transaction_service_js_1 = require("../services/transaction.service.js");
const api_error_js_1 = require("../utils/api-error.js");
class TransactionController {
    constructor() {
        this.transactionService = new transaction_service_js_1.TransactionService();
        // Bind methods
        this.getTransactions = this.getTransactions.bind(this);
        this.getTransaction = this.getTransaction.bind(this);
        // Remove bindings for deleted methods
    }
    /**
     * @description Get transactions for a wallet address with pagination
     * @route GET /api/transactions/:walletAddress
     */
    getTransactions(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { walletAddress } = req.params;
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 20;
                // Default sort can be handled in the service, or passed as query param if needed
                // const sort = (req.query.sort as string) === 'asc' ? 'asc' : 'desc';
                const result = yield this.transactionService.getWalletTransactions(walletAddress, page, limit /*, sort */);
                res.status(200).json(result);
            }
            catch (error) {
                next(error);
            }
        });
    }
    /**
     * @description Get details for a specific transaction hash
     * @route GET /api/transactions/detail/:hash
     */
    getTransaction(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { hash } = req.params;
                if (!hash || typeof hash !== 'string' || !/^0x[a-fA-F0-9]{64}$/.test(hash)) {
                    throw new api_error_js_1.ApiError(400, 'Invalid transaction hash format');
                }
                // Note: The service method currently throws a 501 Not Implemented error
                const transaction = yield this.transactionService.getTransactionDetails(hash);
                res.status(200).json(transaction);
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.TransactionController = TransactionController;
//# sourceMappingURL=transaction.controller.js.map