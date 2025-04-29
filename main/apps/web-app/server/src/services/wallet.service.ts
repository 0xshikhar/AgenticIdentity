import { prisma } from '../index';
// import { ethers } from 'ethers'; // Ethers might still be needed for other utils if not here
// import jwt from 'jsonwebtoken'; // Removed JWT
import { config } from '../config/config';
import { ApiError } from '../utils/api-error';
import { getCurrentBlockNumber, getBlockTimestamp } from '../utils/blockchain';

export class WalletService {
    /**
     * Gets information about a wallet
     * @param walletAddress The address of the wallet
     * @returns Wallet info object
     */
    async getWalletInfo(walletAddress: string) {
        // Convert address to lowercase for consistency
        const normalizedAddress = walletAddress.toLowerCase();
        
        // Check if we have this wallet in our database
        let wallet = await prisma.wallet.findUnique({
            where: {
                address: normalizedAddress
            }
        });
        
        // If not in database, create a basic entry
        if (!wallet) {
            wallet = await prisma.wallet.create({
                data: {
                    address: normalizedAddress,
                    firstSeen: new Date(),
                    isRegistered: false
                }
            });
        }
        
        // Get first transaction (to determine wallet age)
        const firstTransaction = await prisma.transaction.findFirst({
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
        let firstTxTimestamp: Date | null = null;
        if (firstTransaction) {
            firstTxTimestamp = firstTransaction.timestamp;
            const firstTxTime = firstTransaction.timestamp.getTime();
            walletAge = Math.floor((Date.now() - firstTxTime) / (1000 * 60 * 60 * 24));
        } else {
            // If no transactions, use the wallet creation time if available
            const firstSeenTime = wallet.firstSeen?.getTime();
            if (firstSeenTime) {
                walletAge = Math.floor((Date.now() - firstSeenTime) / (1000 * 60 * 60 * 24));
            }
        }
        
        // Get transaction count
        const transactionCount = await prisma.transaction.count({
            where: {
                OR: [
                    { from: normalizedAddress },
                    { to: normalizedAddress }
                ]
            }
        });
        
        // Count contract interactions initiated by this wallet
        const contractInteractions = await prisma.transaction.count({
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
    }
    
    /**
     * Registers a wallet in the system after signature verification
     * @param address The wallet address to register
     * @returns The created or updated wallet object
     */
    async registerWallet(address: string) {
        const normalizedAddress = address.toLowerCase();
        
        // Use upsert to create or update the wallet registration status
        return prisma.wallet.upsert({
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
    }
    
    /**
     * Gets a list of all registered wallets
     * @returns Array of wallet objects
     */
    async getAllWallets() {
        return prisma.wallet.findMany({
            where: {
                isRegistered: true
            },
            orderBy: {
                firstSeen: 'desc'
            }
        });
    }
} 