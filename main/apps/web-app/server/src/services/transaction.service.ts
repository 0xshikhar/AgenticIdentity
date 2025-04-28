// server/src/services/transaction.service.ts
import { prisma } from '../index';
import { ApiError } from '../utils/api-error';
import { fetchTransactions } from '../utils/blockchain';

export class TransactionService {
    async getWalletTransactions(
        walletAddress: string,
        page: number = 1,
        limit: number = 20,
        sort: 'asc' | 'desc' = 'desc'
    ) {
        // Convert address to lowercase for consistency
        const normalizedAddress = walletAddress.toLowerCase();

        // Get transactions from database
        const transactions = await prisma.transaction.findMany({
            where: {
                OR: [
                    { from: normalizedAddress },
                    { to: normalizedAddress }
                ]
            },
            orderBy: {
                timestamp: sort
            },
            skip: (page - 1) * limit,
            take: limit
        });

        // Get total count for pagination
        const totalCount = await prisma.transaction.count({
            where: {
                OR: [
                    { from: normalizedAddress },
                    { to: normalizedAddress }
                ]
            }
        });

        // If no transactions found in database, try to fetch from blockchain
        if (transactions.length === 0 && page === 1) {
            await this.syncWalletTransactions(walletAddress);

            // Try to get transactions again
            const freshTransactions = await prisma.transaction.findMany({
                where: {
                    OR: [
                        { from: normalizedAddress },
                        { to: normalizedAddress }
                    ]
                },
                orderBy: {
                    timestamp: sort
                },
                take: limit
            });

            if (freshTransactions.length > 0) {
                return {
                    data: freshTransactions,
                    pagination: {
                        page,
                        limit,
                        totalCount: await prisma.transaction.count({
                            where: {
                                OR: [
                                    { from: normalizedAddress },
                                    { to: normalizedAddress }
                                ]
                            }
                        }),
                        totalPages: Math.ceil(totalCount / limit)
                    }
                };
            }
        }

        return {
            data: transactions,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        };
    }

    async getTransactionStats(walletAddress: string, period: string = '30d') {
        // Convert address to lowercase for consistency
        const normalizedAddress = walletAddress.toLowerCase();

        // Parse the period to get a start date
        const startDate = this.getStartDateFromPeriod(period);

        // Get transaction stats
        const sentTransactions = await prisma.transaction.count({
            where: {
                from: normalizedAddress,
                timestamp: {
                    gte: startDate
                }
            }
        });

        const receivedTransactions = await prisma.transaction.count({
            where: {
                to: normalizedAddress,
                timestamp: {
                    gte: startDate
                }
            }
        });

        // Get unique addresses interacted with
        const uniqueContacts = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT address) as count 
      FROM (
        SELECT "to" as address FROM "Transaction" 
        WHERE "from" = ${normalizedAddress} AND "timestamp" >= ${startDate}
        UNION
        SELECT "from" as address FROM "Transaction" 
        WHERE "to" = ${normalizedAddress} AND "timestamp" >= ${startDate}
      ) as contacts
    `;

        // Get transaction volume
        const transactionVolume = await prisma.transaction.aggregate({
            _sum: {
                value: true
            },
            where: {
                OR: [
                    { from: normalizedAddress },
                    { to: normalizedAddress }
                ],
                timestamp: {
                    gte: startDate
                }
            }
        });

        // Get contract interactions
        const contractInteractions = await prisma.transaction.count({
            where: {
                from: normalizedAddress,
                isContractInteraction: true,
                timestamp: {
                    gte: startDate
                }
            }
        });

        // Return compiled stats
        return {
            period,
            totalTransactions: sentTransactions + receivedTransactions,
            sentTransactions,
            receivedTransactions,
            uniqueContacts: Number(uniqueContacts[0]?.count || 0),
            transactionVolume: transactionVolume._sum.value || 0,
            contractInteractions,
            averageTransactionsPerDay: (sentTransactions + receivedTransactions) / (this.getPeriodDays(period))
        };
    }

    async syncWalletTransactions(walletAddress: string) {
        // Convert address to lowercase for consistency
        const normalizedAddress = walletAddress.toLowerCase();

        try {
            // Fetch transactions from blockchain
            const transactions = await fetchTransactions(normalizedAddress);

            // Skip if no transactions found
            if (!transactions || transactions.length === 0) {
                return { success: true, message: 'No transactions found' };
            }

            // Process and save transactions
            for (const tx of transactions) {
                // Check if transaction already exists
                const existingTx = await prisma.transaction.findUnique({
                    where: {
                        hash: tx.hash
                    }
                });

                // Skip if transaction already exists
                if (existingTx) continue;

                // Determine if it's a contract interaction
                const isContractInteraction = tx.input && tx.input !== '0x';

                // Save transaction
                await prisma.transaction.create({
                    data: {
                        hash: tx.hash,
                        from: tx.from.toLowerCase(),
                        to: tx.to ? tx.to.toLowerCase() : null,
                        value: parseFloat(tx.value),
                        gasUsed: parseInt(tx.gasUsed || '0'),
                        gasPrice: parseFloat(tx.gasPrice || '0'),
                        timestamp: new Date(parseInt(tx.timeStamp) * 1000),
                        blockNumber: parseInt(tx.blockNumber),
                        isContractInteraction,
                        status: tx.isError === '0' ? 'success' : 'failed',
                        transactionFee: parseFloat(tx.gasUsed || '0') * parseFloat(tx.gasPrice || '0')
                    }
                });
            }

            return { success: true, count: transactions.length };
        } catch (error) {
            console.error('Error syncing wallet transactions:', error);
            throw new ApiError(500, 'Failed to sync wallet transactions');
        }
    }

    async getTransactionDetails(transactionHash: string) {
        // Check if transaction exists in database
        const transaction = await prisma.transaction.findUnique({
            where: {
                hash: transactionHash
            }
        });

        if (!transaction) {
            throw new ApiError(404, 'Transaction not found');
        }

        return transaction;
    }

    async getNetworkActivity(period: string = '30d') {
        const startDate = this.getStartDateFromPeriod(period);

        // Get daily transaction counts
        const dailyActivity = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "timestamp") as day,
        COUNT(*) as count
      FROM "Transaction"
      WHERE "timestamp" >= ${startDate}
      GROUP BY DATE_TRUNC('day', "timestamp")
      ORDER BY day ASC
    `;

        // Get total transactions in period
        const totalTransactions = await prisma.transaction.count({
            where: {
                timestamp: {
                    gte: startDate
                }
            }
        });

        // Get unique active wallets
        const activeWallets = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT address) as count
      FROM (
        SELECT "from" as address FROM "Transaction"
        WHERE "timestamp" >= ${startDate}
        UNION
        SELECT "to" as address FROM "Transaction"
        WHERE "to" IS NOT NULL AND "timestamp" >= ${startDate}
      ) as addresses
    `;

        return {
            period,
            totalTransactions,
            activeWallets: Number(activeWallets[0]?.count || 0),
            dailyActivity
        };
    }

    // Helper methods
    private getStartDateFromPeriod(period: string): Date {
        const now = new Date();
        const value = parseInt(period.slice(0, -1));
        const unit = period.slice(-1).toLowerCase();

        switch (unit) {
            case 'd': // days
                return new Date(now.setDate(now.getDate() - value));
            case 'w': // weeks
                return new Date(now.setDate(now.getDate() - (value * 7)));
            case 'm': // months
                return new Date(now.setMonth(now.getMonth() - value));
            case 'y': // years
                return new Date(now.setFullYear(now.getFullYear() - value));
            default:
                throw new ApiError(400, `Invalid period format: ${period}. Use format like "30d", "4w", "6m", "1y"`);
        }
    }

    private getPeriodDays(period: string): number {
        const value = parseInt(period.slice(0, -1));
        const unit = period.slice(-1).toLowerCase();

        switch (unit) {
            case 'd': // days
                return value;
            case 'w': // weeks
                return value * 7;
            case 'm': // months (approximate)
                return value * 30;
            case 'y': // years (approximate)
                return value * 365;
            default:
                throw new ApiError(400, `Invalid period format: ${period}. Use format like "30d", "4w", "6m", "1y"`);
        }
    }
}
