// server/src/routes/wallet.routes.ts
import { Router } from 'express';
import { WalletController } from '../controllers/wallet.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const walletController = new WalletController();

// Public routes
router.get('/:walletAddress', walletController.getWalletInfo);

// Protected routes
router.post('/verify', authMiddleware, walletController.verifyWallet);
router.post('/register', walletController.registerWallet);

export const walletRoutes = router;