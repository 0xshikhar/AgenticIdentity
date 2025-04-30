// server/src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { config } from './config/config';
import { errorMiddleware } from './middleware/error.middleware.js';
import { loggerMiddleware } from './middleware/logger.middleware.js';
import scoreRoutes from './routes/score.routes.js';
import { transactionRoutes } from './routes/transaction.routes.js';
import { walletRoutes } from './routes/wallet.routes.js';
// import { PrismaClient } from '@prisma/client'; // Removed

// Initialize prisma client - Removed
// export const prisma = new PrismaClient(); // Removed

async function startServer() {
    const app = express();

    // Middleware
    app.use(cors());
    app.use(helmet());
    app.use(express.json());
    app.use(loggerMiddleware);

    // Health check route
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // API Routes
    app.use('/api/score', scoreRoutes);
    app.use('/api/transactions', transactionRoutes);
    app.use('/api/wallet', walletRoutes);

    // Error handling
    app.use(errorMiddleware);

    // Connect to database and start server - Removed DB connection
    try {
        // await prisma.$connect(); // Removed
        // console.log('Connected to database successfully'); // Removed

        const server = createServer(app);

        server.listen(config.port, () => {
            console.log(`Server running on port ${config.port}`);
        });

        // Handle shutdown gracefully
        const shutdown = async () => {
            console.log('Shutting down server...');
            // await prisma.$disconnect(); // Removed
            process.exit(0);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

    } catch (error) {
        console.error('Failed to start server:', error);
        // await prisma.$disconnect(); // Removed
        process.exit(1);
    }
}

startServer().catch(err => {
    console.error('Unhandled error during server startup:', err);
    process.exit(1);
});