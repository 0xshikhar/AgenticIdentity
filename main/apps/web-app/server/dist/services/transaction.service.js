"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
// server/src/services/transaction.service.ts
const index_1 = require("../index");
const api_error_1 = require("../utils/api-error");
const blockchain_1 = require("../utils/blockchain");
class TransactionService {
    getWalletTransactions(walletAddress_1) {
        return __awaiter(this, arguments, void 0, function* (walletAddress, page = 1, limit = 20, sort = 'desc') {
            const normalizedAddress = walletAddress.toLowerCase();
            const skip = (page - 1) * limit;
            const transactions = yield index_1.prisma.transaction.findMany({
                where: { OR: [{ from: normalizedAddress }, { to: normalizedAddress }] },
                orderBy: { timestamp: sort },
                skip,
                take: limit
            });
            const totalCount = yield index_1.prisma.transaction.count({
                where: { OR: [{ from: normalizedAddress }, { to: normalizedAddress }] }
            });
            // Optional: Trigger sync if no transactions found on first page request
            if (transactions.length === 0 && page === 1 && totalCount === 0) {
                console.log(`No transactions found for ${normalizedAddress}, attempting sync.`);
                yield this.syncWalletTransactions(normalizedAddress);
                // Re-query after sync
                const freshTransactions = yield index_1.prisma.transaction.findMany({
                    where: { OR: [{ from: normalizedAddress }, { to: normalizedAddress }] },
                    orderBy: { timestamp: sort },
                    skip,
                    take: limit
                });
                const freshTotalCount = yield index_1.prisma.transaction.count({
                    where: { OR: [{ from: normalizedAddress }, { to: normalizedAddress }] }
                });
                return {
                    data: freshTransactions,
                    pagination: {
                        page,
                        limit,
                        totalCount: freshTotalCount,
                        totalPages: Math.ceil(freshTotalCount / limit)
                    }
                };
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
        });
    }
    getTransactionStats(walletAddress_1) {
        return __awaiter(this, arguments, void 0, function* (walletAddress, period = 'all') {
            const normalizedAddress = walletAddress.toLowerCase();
            const isAllTime = period === 'all';
            const startDate = isAllTime ? undefined : this.getStartDateFromPeriod(period);
            const whereClause = {
                OR: [
                    { from: normalizedAddress },
                    { to: normalizedAddress }
                ]
            };
            if (startDate) {
                whereClause.timestamp = { gte: startDate };
            }
            // Fetch all relevant transactions for the period at once
            const transactions = yield index_1.prisma.transaction.findMany({ where: whereClause });
            const sentTransactionsList = transactions.filter((tx) => tx.from === normalizedAddress);
            const receivedTransactionsList = transactions.filter((tx) => tx.to === normalizedAddress);
            const sentTransactions = sentTransactionsList.length;
            const receivedTransactions = receivedTransactionsList.length;
            const totalTransactions = transactions.length;
            // Calculate total value (consider using BigInt for precision if values can be large)
            const totalValueSent = sentTransactionsList.reduce((sum, tx) => sum + (tx.value || 0), 0);
            const totalValueReceived = receivedTransactionsList.reduce((sum, tx) => sum + (tx.value || 0), 0);
            const netValueChange = totalValueReceived - totalValueSent; // Example derived stat
            const totalValue = totalValueSent + totalValueReceived; // Or just total volume if needed
            // Unique contacts (sent to or received from)
            const contacts = new Set([
                ...sentTransactionsList.map((tx) => tx.to).filter(Boolean), // Filter out null 'to' addresses
                ...receivedTransactionsList.map((tx) => tx.from)
            ]);
            // Remove self from contacts if present
            contacts.delete(normalizedAddress);
            const uniqueContacts = contacts.size;
            // Contract interactions initiated by this wallet
            const contractInteractions = sentTransactionsList.filter((tx) => tx.isContractInteraction).length;
            // Unique contract addresses interacted with (initiated by this wallet)
            const uniqueContractAddresses = new Set(sentTransactionsList
                .filter((tx) => tx.isContractInteraction && tx.to)
                .map((tx) => tx.to) // Use non-null assertion as we filtered
            ).size;
            // Calculate stats for specific recent periods (e.g., 30/90 days) regardless of the main 'period'
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
            const transactionsLast30Days = transactions.filter((tx) => tx.timestamp >= thirtyDaysAgo).length;
            const transactionsLast90Days = transactions.filter((tx) => tx.timestamp >= ninetyDaysAgo).length;
            // Calculate average value
            const avgValue = totalTransactions > 0 ? totalValue / totalTransactions : 0;
            // Calculate average transactions per day (if period is not 'all')
            let averageTransactionsPerDay = 0;
            if (!isAllTime) {
                const days = this.getPeriodDays(period);
                averageTransactionsPerDay = days > 0 ? totalTransactions / days : 0;
            }
            return {
                period, // The requested period
                totalTransactions,
                sentTransactions,
                receivedTransactions,
                totalValue, // Total value transacted (sent + received)
                avgValue, // Average value per transaction
                netValueChange, // Example derived stat
                uniqueContacts, // Renamed from uniqueRecipients for clarity
                contractInteractions, // Interactions initiated by the wallet
                uniqueContractAddresses, // Unique contracts called by the wallet
                transactionsLast30Days, // Always calculated
                transactionsLast90Days, // Always calculated
                averageTransactionsPerDay: isAllTime ? null : averageTransactionsPerDay, // Only relevant for specific periods
            };
        });
    }
    // async getTransactionStats(
    //     address: string,
    //     period: string
    // ): Promise<TransactionStats> {
    //     const txs = await this.fetchTransactions(address, period)
    //     const uniqueContacts = new Set<string>()
    //     const uniqueContractAddresses = new Set<string>()
    //     const uniqueRecipients = new Set<string>()
    //     for (const tx of txs) {
    //         if (tx.to) uniqueRecipients.add(tx.to.toLowerCase())
    //     }
    //     return {
    //         period,
    //         totalTransactions: txs.length,
    //         sentTransactions,
    //         receivedTransactions,
    //         totalValue,
    //         avgValue,
    //         netValueChange,
    //         uniqueContacts: uniqueContacts.size,
    //         contractInteractions,
    //         uniqueContractAddresses: uniqueContractAddresses.size,
    //         transactionsLast30Days,
    //         transactionsLast90Days,
    //         averageTransactionsPerDay,
    //         uniqueRecipients: uniqueRecipients.size,
    //     }
    // }
    /**
     * Analyzes transactions for patterns and insights.
     * Currently, it returns the same as getTransactionStats but could be expanded.
     */
    analyzeTransactions(walletAddress_1) {
        return __awaiter(this, arguments, void 0, function* (walletAddress, period = 'all') {
            // For now, analysis is the same as stats. Can be expanded later.
            const stats = yield this.getTransactionStats(walletAddress, period);
            // Example: Add a simple activity classification
            let activityLevel = 'low';
            if (stats.transactionsLast30Days > 50)
                activityLevel = 'high';
            else if (stats.transactionsLast30Days > 10)
                activityLevel = 'medium';
            return Object.assign(Object.assign({}, stats), { 
                // Add more derived insights here
                activityLevel });
        });
    }
    syncWalletTransactions(walletAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const normalizedAddress = walletAddress.toLowerCase();
            const jobId = `sync-${normalizedAddress.substring(0, 8)}-${Date.now()}`; // Generate an ID
            try {
                const transactions = yield (0, blockchain_1.fetchTransactions)(normalizedAddress);
                let count = 0;
                if (!transactions || transactions.length === 0) {
                    console.log(`No transactions found via API for ${normalizedAddress}`);
                    return { success: true, message: 'No new transactions found via API', id: jobId };
                }
                console.log(`Fetched ${transactions.length} transactions via API for ${normalizedAddress}. Processing...`);
                const existingHashes = new Set((yield index_1.prisma.transaction.findMany({
                    where: {
                        OR: [
                            { from: normalizedAddress },
                            { to: normalizedAddress }
                        ]
                    },
                    select: { hash: true }
                })).map((t) => t.hash));
                const transactionsToCreate = [];
                for (const tx of transactions) {
                    if (!existingHashes.has(tx.hash)) {
                        const isContractInteraction = tx.input && tx.input !== '0x';
                        const toAddress = tx.to ? tx.to.toLowerCase() : null; // Handle null 'to' (contract creation)
                        // Basic validation
                        if (!tx.hash || !tx.from || !tx.blockNumber || !tx.timeStamp) {
                            console.warn(`Skipping invalid transaction data for ${normalizedAddress}:`, tx);
                            continue;
                        }
                        transactionsToCreate.push({
                            hash: tx.hash,
                            from: tx.from.toLowerCase(),
                            to: toAddress,
                            // Ensure value is parsed correctly, handle potential large numbers if necessary
                            value: parseFloat(tx.value || '0'), // Use parseFloat, default to 0
                            gasUsed: parseInt(tx.gasUsed || '0'),
                            gasPrice: parseFloat(tx.gasPrice || '0'),
                            timestamp: new Date(parseInt(tx.timeStamp) * 1000),
                            blockNumber: parseInt(tx.blockNumber),
                            isContractInteraction,
                            status: tx.isError === '0' ? 'success' : 'failed',
                            // Calculate transaction fee safely
                            transactionFee: (parseInt(tx.gasUsed || '0') * parseFloat(tx.gasPrice || '0')) / 1e18 // Example: Convert from Wei to Ether if needed
                        });
                        count++;
                    }
                }
                if (transactionsToCreate.length > 0) {
                    yield index_1.prisma.transaction.createMany({
                        data: transactionsToCreate,
                        skipDuplicates: true, // Although we checked, this adds safety
                    });
                    console.log(`Saved ${count} new transactions for ${normalizedAddress}`);
                    return { success: true, count, id: jobId };
                }
                else {
                    console.log(`No new transactions to save for ${normalizedAddress}`);
                    return { success: true, message: 'No new transactions to save', id: jobId };
                }
            }
            catch (error) {
                console.error(`Error syncing transactions for ${normalizedAddress} (Job ID: ${jobId}):`, error);
                // Don't re-throw ApiError here, just log and return failure
                return { success: false, message: `Failed to sync transactions: ${error instanceof Error ? error.message : 'Unknown error'}`, id: jobId };
            }
        });
    }
    getTransactionDetails(transactionHash) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if transaction exists in database
            const transaction = yield index_1.prisma.transaction.findUnique({
                where: {
                    hash: transactionHash
                }
            });
            if (!transaction) {
                throw new api_error_1.ApiError(404, 'Transaction not found');
            }
            return transaction;
        });
    }
    getNetworkActivity() {
        return __awaiter(this, arguments, void 0, function* (period = '30d') {
            var _a;
            const startDate = this.getStartDateFromPeriod(period);
            // Get daily transaction counts
            const dailyActivity = yield index_1.prisma.$queryRaw `
      SELECT 
        DATE_TRUNC('day', "timestamp") as day,
        COUNT(*) as count
      FROM "Transaction"
      WHERE "timestamp" >= ${startDate}
      GROUP BY DATE_TRUNC('day', "timestamp")
      ORDER BY day ASC
    `;
            // Get total transactions in period
            const totalTransactions = yield index_1.prisma.transaction.count({
                where: {
                    timestamp: {
                        gte: startDate
                    }
                }
            });
            // Get unique active wallets
            const activeWallets = yield index_1.prisma.$queryRaw `
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
                activeWallets: Number(((_a = activeWallets[0]) === null || _a === void 0 ? void 0 : _a.count) || 0),
                dailyActivity
            };
        });
    }
    // Helper methods
    getStartDateFromPeriod(period) {
        const now = new Date();
        // Handle 'all' case - return a very old date or handle differently
        if (period === 'all')
            return new Date(0); // Start of epoch
        const value = parseInt(period.slice(0, -1));
        const unit = period.slice(-1).toLowerCase();
        if (isNaN(value))
            throw new api_error_1.ApiError(400, `Invalid period value: ${period}`);
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
                throw new api_error_1.ApiError(400, `Invalid period format: ${period}. Use format like "30d", "4w", "6m", "1y" or "all"`);
        }
    }
    getPeriodDays(period) {
        if (period === 'all')
            return Infinity; // Or handle as needed
        const value = parseInt(period.slice(0, -1));
        const unit = period.slice(-1).toLowerCase();
        if (isNaN(value))
            throw new api_error_1.ApiError(400, `Invalid period value: ${period}`);
        switch (unit) {
            case 'd': return value;
            case 'w': return value * 7;
            case 'm': return value * 30; // Approximation
            case 'y': return value * 365; // Approximation
            default:
                throw new api_error_1.ApiError(400, `Invalid period format: ${period}. Use format like "30d", "4w", "6m", "1y" or "all"`);
        }
    }
}
exports.TransactionService = TransactionService;
//# sourceMappingURL=transaction.service.js.map