"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionRoutes = void 0;
// server/src/routes/transaction.routes.ts
const express_1 = require("express");
const transaction_controller_js_1 = require("../controllers/transaction.controller.js");
// Import middleware if still used
// import { authMiddleware } from '../middleware/auth.middleware.js';
const router = (0, express_1.Router)();
const transactionController = new transaction_controller_js_1.TransactionController();
// Use only the methods that exist in the updated controller
router.get('/:walletAddress', transactionController.getTransactions);
router.get('/detail/:hash', transactionController.getTransaction);
// Remove or comment out routes for removed controller methods
// router.get('/stats/:walletAddress', transactionController.getTransactionStats);
// router.post('/analyze', authMiddleware, transactionController.analyzeTransactions);
// router.post('/sync/:walletAddress', authMiddleware, transactionController.syncWalletTransactions);
exports.transactionRoutes = router;
//# sourceMappingURL=transaction.routes.js.map