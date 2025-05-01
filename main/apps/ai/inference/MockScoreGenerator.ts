import { ReputationScore } from './ScoreGenerator.js'; 

export class MockScoreGenerator {
    private isInitialized = false;

    async initialize(): Promise<void> {
        this.isInitialized = true;
        console.log('Mock reputation model initialized successfully');
    }

    async generateScore(walletAddress: string): Promise<ReputationScore> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const score = 30 + Math.floor(Math.random() * 26);
        const confidence = 0.7 + (Math.random() * 0.3);
        
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
        
        return {
            walletAddress: walletAddress,     
            score: score,
            confidence: confidence,
            factors: factors,
            updated: new Date()
        };
    }
} 