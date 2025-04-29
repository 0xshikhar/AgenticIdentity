import * as tf from '@tensorflow/tfjs-node'
import { ReputationModel } from '../models/ReputationModel'
import { FeatureExtractor } from '../features/FeatureExtractor'
import { loadModelConfig } from '../utils/model-utils'
import path from 'path'
import { prisma } from '../../server/src/index'

export interface ReputationScore {
    score: number
    confidence: number
    factors: {
        name: string
        contribution: number
        value: number
    }[]
    updated: Date
}

export class ScoreGenerator {
    private model: ReputationModel
    private featureExtractor: FeatureExtractor
    private modelLoaded: boolean = false

    constructor() {
        this.featureExtractor = new FeatureExtractor()
    }

    async initialize(): Promise<void> {
        if (this.modelLoaded) return

        try {
            const modelDir = path.join(__dirname, '../../data/models')
            const modelConfig = await loadModelConfig(path.join(modelDir, 'model_config.json'))

            this.model = new ReputationModel(modelConfig)
            await this.model.load(path.join(modelDir, 'reputation_model'))

            this.modelLoaded = true
            console.log('Reputation model loaded successfully')
        } catch (error) {
            console.error('Failed to load reputation model:', error)
            throw new Error('Model initialization failed')
        }
    }

    async generateScore(walletAddress: string): Promise<ReputationScore> {
        // Ensure model is loaded
        if (!this.modelLoaded) {
            await this.initialize()
        }

        // Extract features
        const walletFeatures = await this.featureExtractor.extractFeatures(walletAddress)
        const normalizedFeatures = await this.featureExtractor.normalizeFeatures(walletFeatures.features)

        // Predict score
        const featureTensor = tf.tensor2d([normalizedFeatures])
        const prediction = this.model.predict(featureTensor)
        const rawScore = prediction.dataSync()[0]

        // Scale to 0-100
        const score = Math.round(rawScore * 100)

        // Simple confidence calculation based on data availability
        const txCount = walletFeatures.features[0]
        let confidence = 0

        if (txCount >= 100) confidence = 0.9
        else if (txCount >= 50) confidence = 0.8
        else if (txCount >= 20) confidence = 0.7
        else if (txCount >= 10) confidence = 0.6
        else if (txCount >= 5) confidence = 0.5
        else confidence = 0.3

        // Determine factor contributions
        const factors = this.calculateFactorContributions(walletFeatures, normalizedFeatures)

        // Save score to database
        await this.saveScoreToDatabase(walletAddress, score, confidence, factors)

        // Clean up tensors
        featureTensor.dispose()
        prediction.dispose()

        return {
            score,
            confidence,
            factors,
            updated: new Date()
        }
    }

    private calculateFactorContributions(
        walletFeatures: { featureNames: string[], features: number[] },
        normalizedFeatures: number[]
    ): { name: string, contribution: number, value: number }[] {
        // This is a simplified implementation of feature contribution calculation
        // In a real system, this would use techniques like SHAP values or permutation importance

        // Mock weights for each feature (would typically come from model analysis)
        const featureWeights = [
            0.25, // transactionCount
            0.15, // sentTransactionCount
            0.10, // receivedTransactionCount
            0.20, // uniqueContacts
            0.10, // transactionVolume
            0.05, // contractInteractions
            0.05, // transactionFrequency
            0.03, // sentToReceivedRatio
            0.03, // averageTransactionValue
            0.02, // contractInteractionRatio
            0.02  // networkDensity
        ]

        // Calculate contributions
        const totalWeight = featureWeights.reduce((sum, weight) => sum + weight, 0)

        return walletFeatures.featureNames.map((name, index) => {
            const normalizedValue = normalizedFeatures[index]
            const rawValue = walletFeatures.features[index]
            const weight = featureWeights[index]

            return {
                name,
                // Scale contribution to percentage
                contribution: Math.round((normalizedValue * weight / totalWeight) * 100),
                value: rawValue
            }
        }).sort((a, b) => b.contribution - a.contribution)
    }

    private async saveScoreToDatabase(
        walletAddress: string,
        score: number,
        confidence: number,
        factors: { name: string, contribution: number, value: number }[]
    ): Promise<void> {
        try {
            // Check if wallet exists
            const wallet = await prisma.wallet.findUnique({
                where: { address: walletAddress.toLowerCase() }
            })

            if (!wallet) {
                // Create wallet record if it doesn't exist
                await prisma.wallet.create({
                    data: { address: walletAddress.toLowerCase() }
                })
            }

            // Save or update score
            await prisma.reputationScore.upsert({
                where: {
                    walletAddress_scoreType: {
                        walletAddress: walletAddress.toLowerCase(),
                        scoreType: 'OVERALL'
                    }
                },
                update: {
                    score,
                    confidence,
                    factors: JSON.stringify(factors),
                    updatedAt: new Date()
                },
                create: {
                    walletAddress: walletAddress.toLowerCase(),
                    scoreType: 'OVERALL',
                    score,
                    confidence,
                    factors: JSON.stringify(factors)
                }
            })
        } catch (error) {
            console.error('Error saving score to database:', error)
        }
    }
} 