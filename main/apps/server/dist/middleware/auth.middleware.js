"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_js_1 = require("../config/config.js");
const api_error_js_1 = require("../utils/api-error.js");
const authMiddleware = (req, res, next) => {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new api_error_js_1.ApiError(401, 'Authentication required'));
    }
    const token = authHeader.split(' ')[1];
    try {
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, config_js_1.config.jwt.secret);
        // Add user to request
        req.user = decoded;
        next();
    }
    catch (error) {
        return next(new api_error_js_1.ApiError(401, 'Invalid or expired token'));
    }
};
exports.authMiddleware = authMiddleware;
// Middleware to check if user has admin role
const adminMiddleware = (req, res, next) => {
    const authReq = req;
    if (!authReq.user || authReq.user.role !== 'admin') {
        return next(new api_error_js_1.ApiError(403, 'Admin access required'));
    }
    next();
};
exports.adminMiddleware = adminMiddleware;
//# sourceMappingURL=auth.middleware.js.map