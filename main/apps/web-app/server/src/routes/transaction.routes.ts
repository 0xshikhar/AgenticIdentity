// server/src/routes/transaction.routes.ts
import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const transactionController = new TransactionController();

// Public routes
router.get('/:walletAddress', transactionController.getTransactions);
router.get('/stats/:walletAddress', transactionController.getTransactionStats);

// Protected routes
router.post('/analyze', authMiddleware, transactionController.analyzeTransactions);
router.post('/sync/:walletAddress', authMiddleware, transactionController.syncWalletTransactions);

export const transactionRoutes = router;
