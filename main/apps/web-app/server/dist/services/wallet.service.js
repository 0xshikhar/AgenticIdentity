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
exports.WalletService = void 0;
const index_1 = require("../index");
class WalletService {
    /**
     * Gets information about a wallet
     * @param walletAddress The address of the wallet
     * @returns Wallet info object
     */
    getWalletInfo(walletAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // Convert address to lowercase for consistency
            const normalizedAddress = walletAddress.toLowerCase();
            // Check if we have this wallet in our database
            let wallet = yield index_1.prisma.wallet.findUnique({
                where: {
                    address: normalizedAddress
                }
            });
            // If not in database, create a basic entry
            if (!wallet) {
                wallet = yield index_1.prisma.wallet.create({
                    data: {
                        address: normalizedAddress,
                        firstSeen: new Date(),
                        isRegistered: false
                    }
                });
            }
            // Get first transaction (to determine wallet age)
            const firstTransaction = yield index_1.prisma.transaction.findFirst({
                where: {
                    OR: [
                        { from: normalizedAddress },
                        { to: normalizedAddress }
                    ]
                },
                orderBy: {
                    blockNumber: 'asc'
                }
            });
            // Calculate wallet age (in days)
            let walletAge = 0;
            let firstTxTimestamp = null;
            if (firstTransaction) {
                firstTxTimestamp = firstTransaction.timestamp;
                const firstTxTime = firstTransaction.timestamp.getTime();
                walletAge = Math.floor((Date.now() - firstTxTime) / (1000 * 60 * 60 * 24));
            }
            else {
                // If no transactions, use the wallet creation time if available
                const firstSeenTime = (_a = wallet.firstSeen) === null || _a === void 0 ? void 0 : _a.getTime();
                if (firstSeenTime) {
                    walletAge = Math.floor((Date.now() - firstSeenTime) / (1000 * 60 * 60 * 24));
                }
            }
            // Get transaction count
            const transactionCount = yield index_1.prisma.transaction.count({
                where: {
                    OR: [
                        { from: normalizedAddress },
                        { to: normalizedAddress }
                    ]
                }
            });
            // Count contract interactions initiated by this wallet
            const contractInteractions = yield index_1.prisma.transaction.count({
                where: {
                    from: normalizedAddress,
                    isContractInteraction: true
                }
            });
            return {
                address: normalizedAddress,
                isRegistered: wallet.isRegistered,
                firstSeen: wallet.firstSeen,
                walletAge,
                transactionCount,
                contractInteractions,
                lastActivity: firstTransaction ? firstTransaction.timestamp : wallet.firstSeen // Use firstSeen if no tx
            };
        });
    }
    /**
     * Registers a wallet in the system after signature verification
     * @param address The wallet address to register
     * @returns The created or updated wallet object
     */
    registerWallet(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const normalizedAddress = address.toLowerCase();
            // Use upsert to create or update the wallet registration status
            return index_1.prisma.wallet.upsert({
                where: {
                    address: normalizedAddress
                },
                update: {
                    isRegistered: true,
                    lastLogin: new Date() // Update last login time on registration/verification
                },
                create: {
                    address: normalizedAddress,
                    isRegistered: true,
                    firstSeen: new Date(), // Set firstSeen on creation
                    lastLogin: new Date()
                }
            });
        });
    }
    /**
     * Gets a list of all registered wallets
     * @returns Array of wallet objects
     */
    getAllWallets() {
        return __awaiter(this, void 0, void 0, function* () {
            return index_1.prisma.wallet.findMany({
                where: {
                    isRegistered: true
                },
                orderBy: {
                    firstSeen: 'desc'
                }
            });
        });
    }
}
exports.WalletService = WalletService;
//# sourceMappingURL=wallet.service.js.map