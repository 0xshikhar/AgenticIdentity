// server/src/controllers/wallet.controller.ts
import { Request, Response, NextFunction } from 'express';
import { WalletService } from '../services/wallet.service';
import { ApiError } from '../utils/api-error';
import { validateAddress, verifySignature } from '../utils/blockchain';

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
                throw ApiError.badRequest('Invalid signature');
            }

            // Generate a JWT token
            const token = await this.walletService.generateAuthToken(address);

            res.status(200).json({
                success: true,
                data: {
                    token,
                    expiresIn: config.jwt.expiresIn
                }
            });
        } catch (error) {
            next(error);
        }
    }

    registerWallet = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { address, signature, message } = req.body;

            if (!address || !signature || !message) {
                throw ApiError.badRequest('Address, signature, and message are required');
            }

            if (!validateAddress(address)) {
                throw ApiError.badRequest('Invalid wallet address format');
            }

            // Verify the signature
            const isValid = verifySignature(address, message, signature);

            if (!isValid) {
                throw ApiError.badRequest('Invalid signature');
            }

            // Register the wallet
            const result = await this.walletService.registerWallet(address);

            // Generate a JWT token
            const token = await this.walletService.generateAuthToken(address);

            res.status(201).json({
                success: true,
                data: {
                    wallet: result,
                    token,
                    expiresIn: config.jwt.expiresIn
                }
            });
        } catch (error) {
            next(error);
        }
    }
}