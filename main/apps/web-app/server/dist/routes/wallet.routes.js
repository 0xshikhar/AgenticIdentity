"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletRoutes = void 0;
// server/src/routes/wallet.routes.ts
const express_1 = require("express");
const wallet_controller_1 = require("../controllers/wallet.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const walletController = new wallet_controller_1.WalletController();
// Public routes
router.get('/:walletAddress', walletController.getWalletInfo);
// Protected routes
router.post('/verify', auth_middleware_1.authMiddleware, walletController.verifyWallet);
router.post('/register', walletController.registerWallet);
exports.walletRoutes = router;
//# sourceMappingURL=wallet.routes.js.map