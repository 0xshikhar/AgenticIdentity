// server/src/controllers/wallet.controller.ts
import { Request, Response, NextFunction } from 'express';
import { WalletService } from '../services/wallet.service';
import { ApiError } from '../utils/api-error';
import { validateAddress, verifySignature } from '../utils/blockchain';
// import { config } from '../config/config'; // No longer needed for JWT expiry

export class WalletController {
    private walletService: WalletService;

    constructor() {
        this.walletService = new WalletService();
    }

    getWalletInfo = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { walletAddress } = req.params;

            if (!validateAddress(walletAddress)) {
                throw ApiError.badRequest('Invalid wallet address format');
            }

            const walletInfo = await this.walletService.getWalletInfo(walletAddress);
            res.status(200).json({ success: true, data: walletInfo });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Verifies wallet ownership via signature.
     * In a stateless setup, this might be called before sensitive actions
     * if not relying on middleware for every request.
     */
    verifyWallet = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { address, message, signature } = req.body;

            if (!address || !message || !signature) {
                throw ApiError.badRequest('Address, message, and signature are required');
            }

            if (!validateAddress(address)) {
                throw ApiError.badRequest('Invalid wallet address format');
            }

            // Verify that the signature is valid
            const isValid = verifySignature(address, message, signature);

            if (!isValid) {
                throw ApiError.unauthorized('Invalid signature'); // Use 401 Unauthorized
            }

            // Optionally update last login time or perform other actions upon verification
            // await this.walletService.recordSuccessfulVerification(address);

            // No JWT is returned
            res.status(200).json({
                success: true,
                message: 'Wallet verified successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Registers a wallet after verifying ownership via signature.
     */
    registerWallet = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { address, signature, message } = req.body;

            if (!address || !signature || !message) {
                throw ApiError.badRequest('Address, signature, and message are required');
            }

            if (!validateAddress(address)) {
                throw ApiError.badRequest('Invalid wallet address format');
            }

            // Verify the signature first
            const isValid = verifySignature(address, message, signature);

            if (!isValid) {
                throw ApiError.unauthorized('Invalid signature'); // Use 401 Unauthorized
            }

            // Register the wallet (sets isRegistered = true)
            const result = await this.walletService.registerWallet(address);

            // No JWT is returned
            res.status(201).json({
                success: true,
                message: 'Wallet registered successfully',
                data: {
                    wallet: result // Return the updated wallet record
                }
            });
        } catch (error) {
            next(error);
        }
    }
}