import express from 'express'; 
import cors from 'cors';
// Choose one option based on your preference:

// Option 1: Using the regular ScoreGenerator with DEV_MODE
import { ScoreGenerator } from './inference/ScoreGenerator.js'; 

// Option 2: Using dedicated mock generator
// import { MockScoreGenerator as ScoreGenerator } from './inference/MockScoreGenerator';

const app = express();
const port = process.env.AI_PORT || 8090;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize score generator with model
const scoreGenerator = new ScoreGenerator();

// Health check endpoint    
app.get('/health', (req: any, res: any) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Score generation endpoint
app.get('/score/:walletAddress', async (req: any, res: any ) => {  
    try {
        const { walletAddress } = req.params;
        
        if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid wallet address format' 
            });
        }

        const score = await scoreGenerator.generateScore(walletAddress);
        res.status(200).json({ success: true, data: score });
    } catch (error) {
        console.error('Error generating score:', error);
        res.status(500).json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Initialize the model before starting the server
async function startServer() {
    try {
        console.log('Initializing AI model...');
        await scoreGenerator.initialize();
        console.log('AI model initialized successfully');
        
        app.listen(port, () => {
            console.log(`AI Score Server running at http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Failed to initialize AI model:', error);
        process.exit(1);
    }
}

startServer(); 