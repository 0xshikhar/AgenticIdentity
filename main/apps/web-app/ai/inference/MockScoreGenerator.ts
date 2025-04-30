import { ReputationScore } from './ScoreGenerator';

export class MockScoreGenerator {
    private isInitialized = false;

    async initialize(): Promise<void> {
        // Just set flag to true, no actual model loading
        this.isInitialized = true;
        console.log('Mock reputation model initialized successfully');
    }

    async generateScore(walletAddress: string): Promise<ReputationScore> {
        if (!this.isInitialized) {
            await this.initialize();
        }

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
            address: walletAddress,
            score: score,
            confidence: confidence,
            factors: factors,
            updated: new Date()
        };
    }
} 