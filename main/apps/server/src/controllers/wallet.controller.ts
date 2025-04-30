// server/src/controllers/wallet.controller.ts
import { Request, Response, NextFunction } from 'express';
import { WalletService } from '../services/wallet.service.js';
import { ApiError } from '../utils/api-error.js';
import { validateAddress, verifySignature } from '../utils/blockchain.js';
// import { config } from '../config/config.js'; // No longer needed for JWT expiry

export class WalletController {
    private walletService: WalletService;

    constructor() {
        this.walletService = new WalletService();
        // Bind methods
        this.getInfo = this.getInfo.bind(this);
        this.getAll = this.getAll.bind(this);
        this.verifyWallet = this.verifyWallet.bind(this);
    }

    /**
     * @description Get information about a specific wallet
     * @route GET /api/wallet/:address
     */
    async getInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { address } = req.params;
            const info = await this.walletService.getWalletInfo(address);
            res.status(200).json(info);
        } catch (error) {
            next(error);
        }
    }

     /**
     * @description Get all registered wallets (currently returns empty array)
     * @route GET /api/wallet/
     */
    async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Note: Service method currently returns []
            const wallets = await this.walletService.getAllWallets();
            res.status(200).json(wallets);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Verifies wallet ownership via signature.
     * In a stateless setup, this might be called before sensitive actions
     * if not relying on middleware for every request.
     */
    async verifyWallet(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { address, message, signature } = req.body;

            if (!address || !message || !signature) {
                throw new ApiError(400, 'Address, message, and signature are required');
            }
            
            // Verify that the signature is valid
            const isValid = verifySignature(address, message, signature);

            if (!isValid) {
                throw new ApiError(401, 'Invalid signature'); // 401 Unauthorized
            }

            // No JWT is returned
            res.status(200).json({
                success: true,
                message: 'Wallet verified successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}