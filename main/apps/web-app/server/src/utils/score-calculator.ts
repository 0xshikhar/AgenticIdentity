/**
 * Interface for wallet information
 */
export interface WalletInfo {
    address: string;
    walletAge: number;
    transactionCount: number;
    contractInteractions: number;
    lastActivity: Date | null;
}

export interface TransactionStats {
    period: string
    totalTransactions: number
    sentTransactions: number
    receivedTransactions: number
    totalValue: number
    avgValue: number
    netValueChange: number
    uniqueContacts: number
    contractInteractions: number
    uniqueContractAddresses: number
    transactionsLast30Days: number
    averageTransactionValue: any
    largestTransaction: any
    averageGasUsed: any
    totalGasUsed: any
    contractInteractionCount: any
    uniqueAddressesInteracted: any
    successRate: any
    averageTransactionsPerDay: any
    transactionsLast90Days: any
    uniqueRecipients: any
    isAllTime: boolean
}

// /**
//  * Interface for transaction statistics
//  */
// export interface TransactionStats {
//     totalTransactions: number;
//     sentTransactions: number;
//     receivedTransactions: number;
//     totalValue: number;
//     avgValue: number;
//     contractInteractions: number;
//     uniqueContractAddresses: number;
//     transactionsLast30Days: number;
//     transactionsLast90Days: number;
//     uniqueRecipients: number;
// }

/**
 * Interface for score weights configuration
 */
export interface ScoreWeights {
    walletAge: number;
    transactionVolume: number;
    transactionFrequency: number;
    contractInteractions: number;
    networkDiversity: number;
    stakingHistory: number;
}

/**
 * Interface for a score factor
 */
export interface ScoreFactor {
    name: string;
    value: number;
    score: number;
    contribution: number;
    description: string;
}

/**
 * Interface for the calculated reputation score
 */
export interface ReputationScore {
    score: number;
    factors: ScoreFactor[];
}

/**
 * Calculates a reputation score for a wallet based on its activity
 * @param walletInfo Information about the wallet
 * @param txStats Transaction statistics for the wallet
 * @param weights Configuration weights for different score factors
 * @returns Reputation score object with total score and contributing factors
 */
export function calculateReputationScore(
    walletInfo: WalletInfo,
    txStats: TransactionStats,
    weights: ScoreWeights
): ReputationScore {
    // Initialize factors array
    const factors: ScoreFactor[] = [];

    // Calculate individual factor scores (0-100 scale)

    // 1. Wallet Age
    const walletAgeScore = Math.min(100, walletInfo.walletAge / 365 * 100);
    factors.push({
        name: 'Wallet Age',
        value: walletInfo.walletAge,
        score: walletAgeScore,
        contribution: walletAgeScore * weights.walletAge,
        description: 'Age of wallet in days'
    });

    // 2. Transaction Volume
    const volumeScore = Math.min(100, (txStats.totalValue / 1000) * 100);
    factors.push({
        name: 'Transaction Volume',
        value: txStats.totalValue,
        score: volumeScore,
        contribution: volumeScore * weights.transactionVolume,
        description: 'Total volume of transactions'
    });

    // 3. Transaction Frequency
    const txCountScore = Math.min(100, (txStats.totalTransactions / 100) * 100);
    factors.push({
        name: 'Transaction Frequency',
        value: txStats.totalTransactions,
        score: txCountScore,
        contribution: txCountScore * weights.transactionFrequency,
        description: 'Number of transactions made'
    });

    // 4. Contract Interactions
    const contractScore = Math.min(100, (txStats.contractInteractions / 50) * 100);
    factors.push({
        name: 'Contract Interactions',
        value: txStats.contractInteractions,
        score: contractScore,
        contribution: contractScore * weights.contractInteractions,
        description: 'Number of interactions with smart contracts'
    });

    // 5. Network Diversity
    const diversityScore = Math.min(100, (txStats.uniqueRecipients / 20) * 100);
    factors.push({
        name: 'Network Diversity',
        value: txStats.uniqueRecipients,
        score: diversityScore,
        contribution: diversityScore * weights.networkDiversity,
        description: 'Number of unique addresses interacted with'
    });

    // 6. Recent Activity
    const recentActivityScore = Math.min(100, (txStats.transactionsLast30Days / 10) * 100);
    factors.push({
        name: 'Recent Activity',
        value: txStats.transactionsLast30Days,
        score: recentActivityScore,
        contribution: recentActivityScore * weights.stakingHistory, // Using staking weight for this
        description: 'Activity level in the last 30 days'
    });

    // Calculate total score
    let totalScore = factors.reduce((sum, factor) => sum + factor.contribution, 0);

    // Ensure score is between 0-100
    totalScore = Math.max(0, Math.min(100, totalScore));

    // Round to nearest integer
    totalScore = Math.round(totalScore);

    return {
        score: totalScore,
        factors: factors.sort((a, b) => b.contribution - a.contribution)
    };
} 