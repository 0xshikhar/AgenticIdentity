"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletRoutes = void 0;
// server/src/routes/wallet.routes.ts
const express_1 = require("express");
const wallet_controller_js_1 = require("../controllers/wallet.controller.js");
// Import middleware if still used
// import { authMiddleware } from '../middleware/auth.middleware.js';
const router = (0, express_1.Router)();
const walletController = new wallet_controller_js_1.WalletController();
// Use only the methods that exist in the updated controller
router.get('/:address', walletController.getInfo);
router.get('/', walletController.getAll);
router.post('/verify', walletController.verifyWallet);
// Remove or comment out routes for removed controller methods
// router.post('/register', walletController.registerWallet);
exports.walletRoutes = router;
//# sourceMappingURL=wallet.routes.js.map