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
exports.prisma = void 0;
// server/src/index.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const http_1 = require("http");
const config_1 = require("./config/config");
const error_middleware_1 = require("./middleware/error.middleware");
const logger_middleware_1 = require("./middleware/logger.middleware");
const score_routes_1 = require("./routes/score.routes");
const transaction_routes_1 = require("./routes/transaction.routes");
const wallet_routes_1 = require("./routes/wallet.routes");
const client_1 = require("@prisma/client");
// Initialize prisma client
exports.prisma = new client_1.PrismaClient();
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        const app = (0, express_1.default)();
        // Middleware
        app.use((0, cors_1.default)());
        app.use((0, helmet_1.default)());
        app.use(express_1.default.json());
        app.use(logger_middleware_1.loggerMiddleware);
        // Health check route
        app.get('/health', (req, res) => {
            res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
        });
        // API Routes
        app.use('/api/score', score_routes_1.scoreRoutes);
        app.use('/api/transactions', transaction_routes_1.transactionRoutes);
        app.use('/api/wallet', wallet_routes_1.walletRoutes);
        // Error handling
        app.use(error_middleware_1.errorMiddleware);
        // Connect to database and start server
        try {
            yield exports.prisma.$connect();
            console.log('Connected to database successfully');
            const server = (0, http_1.createServer)(app);
            server.listen(config_1.config.port, () => {
                console.log(`Server running on port ${config_1.config.port}`);
            });
            // Handle shutdown gracefully
            const shutdown = () => __awaiter(this, void 0, void 0, function* () {
                console.log('Shutting down server...');
                yield exports.prisma.$disconnect();
                process.exit(0);
            });
            process.on('SIGINT', shutdown);
            process.on('SIGTERM', shutdown);
        }
        catch (error) {
            console.error('Failed to start server:', error);
            yield exports.prisma.$disconnect();
            process.exit(1);
        }
    });
}
startServer().catch(err => {
    console.error('Unhandled error during server startup:', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map