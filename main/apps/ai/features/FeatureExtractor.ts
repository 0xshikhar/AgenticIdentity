// import { prisma } from '../../server/src/index.js'
import fetch from 'node-fetch'

export interface WalletFeatures {
    walletAddress: string
    features: number[]
    featureNames: string[]
}

export class FeatureExtractor {
    async extractFeatures(walletAddress: string, period: string = '180d'): Promise<WalletFeatures> {
        const normalizedAddress = walletAddress.toLowerCase()
        const startDate = this.getStartDateFromPeriod(period)

        // Extract basic transaction metrics using blockchain API instead of DB
        // All these methods will be replaced with mock data for now
        const txCount = await this.getTransactionCount(normalizedAddress, startDate)
        const sentTxCount = await this.getSentTransactionCount(normalizedAddress, startDate)
        const receivedTxCount = await this.getReceivedTransactionCount(normalizedAddress, startDate)
        const uniqueContacts = await this.getUniqueContactsCount(normalizedAddress, startDate)
        const txVolume = await this.getTransactionVolume(normalizedAddress, startDate)
        const contractInteractions = await this.getContractInteractionCount(normalizedAddress, startDate)

        // Calculate derived features
        const txFrequency = txCount / this.getDaysBetween(startDate, new Date())
        const sentToReceivedRatio = receivedTxCount > 0 ? sentTxCount / receivedTxCount : sentTxCount
        const avgTxValue = txCount > 0 ? txVolume / txCount : 0
        const contractInteractionRatio = txCount > 0 ? contractInteractions / txCount : 0
        const networkDensity = txCount > 0 ? uniqueContacts / txCount : 0

        // Gather all features
        const features = [
            txCount,
            sentTxCount,
            receivedTxCount,
            uniqueContacts,
            txVolume,
            contractInteractions,
            txFrequency,
            sentToReceivedRatio,
            avgTxValue,
            contractInteractionRatio,
            networkDensity
        ]

        const featureNames = [
            'transactionCount',
            'sentTransactionCount',
            'receivedTransactionCount',
            'uniqueContacts',
            'transactionVolume',
            'contractInteractions',
            'transactionFrequency',
            'sentToReceivedRatio',
            'averageTransactionValue',
            'contractInteractionRatio',
            'networkDensity'
        ]

        return {
            walletAddress: normalizedAddress,
            features,
            featureNames
        }
    }

    async normalizeFeatures(features: number[]): Promise<number[]> {
        // Get global statistics for normalization
        const stats = await this.getGlobalFeatureStats()

        // Apply min-max normalization to each feature
        return features.map((value, index) => {
            const min = stats.mins[index]
            const max = stats.maxs[index]

            // Avoid division by zero
            if (max === min) return 0

            return (value - min) / (max - min)
        })
    }

    private async getGlobalFeatureStats(): Promise<{ mins: number[], maxs: number[], means: number[], stds: number[] }> {
        // In a real implementation, these would be calculated from the database
        // For simplicity, we're using placeholder values here
        return {
            mins: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            maxs: [1000, 800, 500, 200, 1000000, 300, 10, 5, 10000, 1, 1],
            means: [100, 60, 40, 30, 50000, 20, 1, 1.5, 500, 0.2, 0.3],
            stds: [200, 150, 100, 50, 100000, 40, 2, 1, 1000, 0.3, 0.2]
        }
    }

    // Replace DB methods with API or mock data implementations
    private async getTransactionCount(address: string, startDate: Date): Promise<number> {
        // Instead of querying the DB, we generate a random number for demo purposes
        // In a real implementation, this would use a blockchain API
        return Math.floor(Math.random() * 100) + 10
    }

    private async getSentTransactionCount(address: string, startDate: Date): Promise<number> {
        // Mock implementation
        const txCount = await this.getTransactionCount(address, startDate)
        return Math.floor(txCount * 0.6) // Assume ~60% are sent transactions
    }

    private async getReceivedTransactionCount(address: string, startDate: Date): Promise<number> {
        // Mock implementation
        const txCount = await this.getTransactionCount(address, startDate)
        return Math.floor(txCount * 0.4) // Assume ~40% are received transactions
    }

    private async getUniqueContactsCount(address: string, startDate: Date): Promise<number> {
        // Mock implementation
        const txCount = await this.getTransactionCount(address, startDate)
        return Math.floor(txCount * 0.3) + 5 // Assume ~30% of tx count represents unique contacts
    }

    private async getTransactionVolume(address: string, startDate: Date): Promise<number> {
        // Mock implementation
        const txCount = await this.getTransactionCount(address, startDate)
        return txCount * (Math.random() * 1000 + 100) // Generate random volume based on tx count
    }

    private async getContractInteractionCount(address: string, startDate: Date): Promise<number> {
        // Mock implementation
        const txCount = await this.getTransactionCount(address, startDate)
        return Math.floor(txCount * 0.2) // Assume ~20% are contract interactions
    }

    private getStartDateFromPeriod(period: string): Date {
        const now = new Date()
        const value = parseInt(period.slice(0, -1))
        const unit = period.slice(-1).toLowerCase()

        switch (unit) {
            case 'd': // days
                return new Date(now.setDate(now.getDate() - value))
            case 'w': // weeks
                return new Date(now.setDate(now.getDate() - (value * 7)))
            case 'm': // months
                return new Date(now.setMonth(now.getMonth() - value))
            case 'y': // years
                return new Date(now.setFullYear(now.getFullYear() - value))
            default:
                throw new Error(`Invalid period format: ${period}. Use format like "30d", "4w", "6m", "1y"`)
        }
    }

    private getDaysBetween(startDate: Date, endDate: Date): number {
        const millisecondsPerDay = 24 * 60 * 60 * 1000
        return Math.round(Math.abs((endDate.getTime() - startDate.getTime()) / millisecondsPerDay))
    }
} 