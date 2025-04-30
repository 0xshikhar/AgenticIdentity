// server/src/routes/wallet.routes.ts
import { Router } from 'express';
import { WalletController } from '../controllers/wallet.controller.js';
// Import middleware if still used
// import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();
const walletController = new WalletController();

// Use only the methods that exist in the updated controller
router.get('/:address', walletController.getInfo);
router.get('/', walletController.getAll);
router.post('/verify', walletController.verifyWallet);

// Remove or comment out routes for removed controller methods
// router.post('/register', walletController.registerWallet);

export const walletRoutes = router;