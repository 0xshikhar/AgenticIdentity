import { Request, Response, NextFunction } from 'express';
import { TransactionService } from '../services/transaction.service.js';
import { ApiError } from '../utils/api-error.js';
import { validateAddress } from '../utils/blockchain.js'

export class TransactionController {
    private transactionService: TransactionService;

    constructor() {
        this.transactionService = new TransactionService();
        // Bind methods
        this.getTransactions = this.getTransactions.bind(this);
        this.getTransaction = this.getTransaction.bind(this);
        // Remove bindings for deleted methods
    }

    /**
     * @description Get transactions for a wallet address with pagination
     * @route GET /api/transactions/:walletAddress
     */
    async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { walletAddress } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            // Default sort can be handled in the service, or passed as query param if needed
            // const sort = (req.query.sort as string) === 'asc' ? 'asc' : 'desc';
            
            const result = await this.transactionService.getWalletTransactions(walletAddress, page, limit /*, sort */);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * @description Get details for a specific transaction hash
     * @route GET /api/transactions/detail/:hash
     */
    async getTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { hash } = req.params;
            if (!hash || typeof hash !== 'string' || !/^0x[a-fA-F0-9]{64}$/.test(hash)) {
                 throw new ApiError(400, 'Invalid transaction hash format');
            }
            // Note: The service method currently throws a 501 Not Implemented error
            const transaction = await this.transactionService.getTransactionDetails(hash);
            res.status(200).json(transaction);
        } catch (error) {
            next(error);
        }
    }

    // Removed getStats handler (was calling getTransactionStats)
    // Removed analyze handler (was calling analyzeTransactions)
    // Removed syncTransactions handler (was calling syncWalletTransactions)

}