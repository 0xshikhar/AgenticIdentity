// server/src/routes/transaction.routes.ts
import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller.js';
// Import middleware if still used
// import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();
const transactionController = new TransactionController();

// Use only the methods that exist in the updated controller
router.get('/:walletAddress', transactionController.getTransactions);
router.get('/detail/:hash', transactionController.getTransaction);

// Remove or comment out routes for removed controller methods
// router.get('/stats/:walletAddress', transactionController.getTransactionStats);
// router.post('/analyze', authMiddleware, transactionController.analyzeTransactions);
// router.post('/sync/:walletAddress', authMiddleware, transactionController.syncWalletTransactions);

export const transactionRoutes = router;
