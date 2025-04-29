import { Request, Response, NextFunction } from 'express';
import { TransactionService } from '../services/transaction.service';
import { ApiError } from '../utils/api-error';
import { validateAddress } from '../utils/blockchain'

export class TransactionController {
    private transactionService: TransactionService;

    constructor() {
        this.transactionService = new TransactionService();
    }

    getTransactions = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { walletAddress } = req.params;
            const { page = '1', limit = '20', sort = 'desc' } = req.query;

            if (!validateAddress(walletAddress)) {
                throw ApiError.badRequest('Invalid wallet address format');
            }

            const transactions = await this.transactionService.getWalletTransactions(
                walletAddress,
                parseInt(page as string),
                parseInt(limit as string),
                sort as 'asc' | 'desc'
            );

            res.status(200).json({ success: true, data: transactions });
        } catch (error) {
            next(error);
        }
    }

    getTransactionStats = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { walletAddress } = req.params;
            const { period } = req.query;

            if (!validateAddress(walletAddress)) {
                throw ApiError.badRequest('Invalid wallet address format');
            }

            const stats = await this.transactionService.getTransactionStats(
                walletAddress,
                period as string || '30d'
            );

            res.status(200).json({ success: true, data: stats });
        } catch (error) {
            next(error);
        }
    }

    analyzeTransactions = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { walletAddress, period } = req.body;

            if (!walletAddress) {
                throw ApiError.badRequest('Wallet address is required');
            }

            if (!validateAddress(walletAddress)) {
                throw ApiError.badRequest('Invalid wallet address format');
            }

            const analysis = await this.transactionService.analyzeTransactions(
                walletAddress,
                period || '30d'
            );

            res.status(200).json({ success: true, data: analysis });
        } catch (error) {
            next(error);
        }
    }

    syncWalletTransactions = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { walletAddress } = req.params;

            if (!validateAddress(walletAddress)) {
                throw ApiError.badRequest('Invalid wallet address format');
            }

            const syncJob = await this.transactionService.syncWalletTransactions(walletAddress);

            if (!syncJob.success) {
                throw new ApiError(500, syncJob.message || 'Transaction sync failed');
            }

            res.status(202).json({
                success: true,
                message: syncJob.message || 'Transaction sync job started',
                jobId: syncJob.id || null
            });
        } catch (error) {
            next(error);
        }
    }
}