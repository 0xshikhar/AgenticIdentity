"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server/src/index.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const http_1 = require("http");
const config_1 = require("./config/config");
const error_middleware_js_1 = require("./middleware/error.middleware.js");
const logger_middleware_js_1 = require("./middleware/logger.middleware.js");
const score_routes_js_1 = __importDefault(require("./routes/score.routes.js"));
const transaction_routes_js_1 = require("./routes/transaction.routes.js");
const wallet_routes_js_1 = require("./routes/wallet.routes.js");
// import { PrismaClient } from '@prisma/client'; // Removed
// Initialize prisma client - Removed
// export const prisma = new PrismaClient(); // Removed
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        const app = (0, express_1.default)();
        // Middleware
        app.use((0, cors_1.default)());
        app.use((0, helmet_1.default)());
        app.use(express_1.default.json());
        app.use(logger_middleware_js_1.loggerMiddleware);
        // Health check route
        app.get('/health', (req, res) => {
            res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
        });
        // API Routes
        app.use('/api/score', score_routes_js_1.default);
        app.use('/api/transactions', transaction_routes_js_1.transactionRoutes);
        app.use('/api/wallet', wallet_routes_js_1.walletRoutes);
        // Error handling
        app.use(error_middleware_js_1.errorMiddleware);
        // Connect to database and start server - Removed DB connection
        try {
            // await prisma.$connect(); // Removed
            // console.log('Connected to database successfully'); // Removed
            const server = (0, http_1.createServer)(app);
            server.listen(config_1.config.port, () => {
                console.log(`Server running on port ${config_1.config.port}`);
            });
            // Handle shutdown gracefully
            const shutdown = () => __awaiter(this, void 0, void 0, function* () {
                console.log('Shutting down server...');
                // await prisma.$disconnect(); // Removed
                process.exit(0);
            });
            process.on('SIGINT', shutdown);
            process.on('SIGTERM', shutdown);
        }
        catch (error) {
            console.error('Failed to start server:', error);
            // await prisma.$disconnect(); // Removed
            process.exit(1);
        }
    });
}
startServer().catch(err => {
    console.error('Unhandled error during server startup:', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map