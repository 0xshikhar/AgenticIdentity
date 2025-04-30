import * as tf from '@tensorflow/tfjs-node'
import { ReputationModel } from '../models/ReputationModel.js'
import { FeatureExtractor } from '../features/FeatureExtractor.js'
import { loadModelConfig } from '../utils/model-utils.js'
import path from 'path'

const DEV_MODE = process.env.NODE_ENV !== 'production';

export interface ReputationScore {
    score: number
    confidence: number
    factors: {
        name: string
        contribution: number
        value: number
    }[]
    updated: Date
    walletAddress: string
}

export class ScoreGenerator {
    private model!: ReputationModel
    private featureExtractor: FeatureExtractor
    private modelLoaded: boolean = false

    constructor() {
        this.featureExtractor = new FeatureExtractor()
    }

    async initialize(): Promise<void> {
        if (this.modelLoaded) return

        try {
            if (DEV_MODE) {
                console.log('Running in development mode with mock model');
                // Create a basic model with default config
                const mockConfig = {
                    inputFeatures: 11,
                    hiddenLayers: [64, 32, 16],
                    dropoutRate: 0.2,
                    learningRate: 0.001
                };
                this.model = new ReputationModel(mockConfig);
                // No need to load a real model file
                this.modelLoaded = true;
                this.featureExtractor = new FeatureExtractor();
                console.log('Mock reputation model initialized successfully');
                return;
            }

            // Original code for production mode
            const modelDir = path.join(__dirname, '../../data/models')
            const modelConfig = await loadModelConfig(path.join(modelDir, 'model_config.json'))

            this.model = new ReputationModel(modelConfig)
            await this.model.load(path.join(modelDir, 'reputation_model'))

            this.modelLoaded = true
            this.featureExtractor = new FeatureExtractor()
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

        if (DEV_MODE) {
            // Generate random but plausible mock data
            const score = Math.floor(Math.random() * 100);
            const confidence = 0.7 + (Math.random() * 0.3); // Between 0.7 and 1.0
            
            // Generate mock factors
            const factors = [
                {
                    name: 'Transaction Volume',
                    value: Math.floor(Math.random() * 1000),
                    score: Math.floor(Math.random() * 100),
                    contribution: Math.floor(Math.random() * 30),
                    description: 'Total volume of transactions'
                },
                {
                    name: 'Wallet Age',
                    value: Math.floor(Math.random() * 365 * 3), // Up to 3 years in days
                    score: Math.floor(Math.random() * 100),
                    contribution: Math.floor(Math.random() * 30),
                    description: 'Age of wallet in days'
                },
                {
                    name: 'Transaction Frequency',
                    value: Math.floor(Math.random() * 500),
                    score: Math.floor(Math.random() * 100),
                    contribution: Math.floor(Math.random() * 30),
                    description: 'Number of transactions'
                }
            ];
            
            // Return mock data
            return {
                walletAddress: walletAddress,
                score: score,
                confidence: confidence,
                factors: factors,
                updated: new Date()
            };
        }

        // Extract features
        const walletFeatures = await this.featureExtractor.extractFeatures(walletAddress)
        const normalizedFeatures = await this.featureExtractor.normalizeFeatures(walletFeatures.features)

        // Predict score
        const featureTensor = tf.tensor([normalizedFeatures]) as tf.ITensor
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

        // Instead of saving to database, prepare the score data
        const scoreData = this.prepareScoreData(walletAddress, score, confidence, factors)

        // Clean up tensors
        featureTensor.dispose()
        prediction.dispose()

        return scoreData
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

    private prepareScoreData(
        walletAddress: string,
        score: number,
        confidence: number,
        factors: { name: string, contribution: number, value: number }[]
    ): ReputationScore {
        // Return the score data that would have been saved to the database
        return {
            walletAddress: walletAddress.toLowerCase(),
            score,
            confidence,
            factors,
            updated: new Date()
        }
    }
} 