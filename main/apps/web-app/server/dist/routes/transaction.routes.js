"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionRoutes = void 0;
// server/src/routes/transaction.routes.ts
const express_1 = require("express");
const transaction_controller_1 = require("../controllers/transaction.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const transactionController = new transaction_controller_1.TransactionController();
// Public routes
router.get('/:walletAddress', transactionController.getTransactions);
router.get('/stats/:walletAddress', transactionController.getTransactionStats);
// Protected routes
router.post('/analyze', auth_middleware_1.authMiddleware, transactionController.analyzeTransactions);
router.post('/sync/:walletAddress', auth_middleware_1.authMiddleware, transactionController.syncWalletTransactions);
exports.transactionRoutes = router;
//# sourceMappingURL=transaction.routes.js.map