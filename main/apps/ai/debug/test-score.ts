import { ScoreGenerator } from '../inference/ScoreGenerator.js';

// Set to true to force DEV_MODE for testing
process.env.DEV_MODE = 'true';

async function testScoreGeneration() {
    console.log("Starting wallet score debug test...");
    
    // Test wallet address
    const testAddress = '0x0000000000000000000000000000000000000000';
    
    try {
        console.log(`Initializing score generator...`);
        const generator = new ScoreGenerator();
        await generator.initialize();
        
        console.log(`Generating score for test address: ${testAddress}`);
        const score = await generator.generateScore(testAddress);
        
        console.log("\n=== SCORE GENERATION RESULT ===");
        console.log(`Wallet: ${score.walletAddress}`);
        console.log(`Score: ${score.score}/100`);
        console.log(`Confidence: ${(score.confidence * 100).toFixed(2)}%`);
        console.log(`Generated at: ${score.updated}`);
        console.log("\nTop factors:");
        
        interface ScoreFactor {
            name: string;
            contribution: number;
            value: number;
            score?: number;
        }

        score.factors.forEach((factor: ScoreFactor, index) => {
            console.log(`${index + 1}. ${factor.name}: ${factor.contribution.toFixed(2)} (score: ${factor.score ?? 0}, value: ${factor.value})`);
        });
        
        console.log("\n✅ Score generation test successful!");
    } catch (error) {
        console.error("\n❌ Score generation test failed!");
        console.error("Error details:", error);
    }
}

testScoreGeneration().catch(console.error); 