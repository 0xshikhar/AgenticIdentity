"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const getEnv = (key, defaultValue = '') => {
    return process.env[key] || defaultValue;
};
exports.config = {
    env: getEnv('NODE_ENV', 'development'),
    port: parseInt(getEnv('PORT', '4000')),
    rskNode: {
        url: getEnv('RSK_NODE_URL', 'https://public-node.rsk.co')
    },
    rootstockApi: {
        url: getEnv('ROOTSTOCK_API_URL', 'https://rootstock-testnet.blockscout.com'),
        apiKey: getEnv('ROOTSTOCK_API_KEY', '')
    },
    jwt: {
        secret: getEnv('JWT_SECRET', 'your-secret-key'),
        expiresIn: getEnv('JWT_EXPIRES_IN', '7d')
    },
    scoreConfig: {
        // Weights for different factors in reputation score calculation
        weights: {
            walletAge: 0.15,
            transactionVolume: 0.25,
            transactionFrequency: 0.20,
            contractInteractions: 0.15,
            networkDiversity: 0.15,
            stakingHistory: 0.10
        },
        // Cache duration for scores in seconds (1 day)
        cacheDuration: 86400
    }
};
//# sourceMappingURL=config.js.map