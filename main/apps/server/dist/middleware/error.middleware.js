"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const api_error_js_1 = require("../utils/api-error.js");
const library_1 = require("@prisma/client/runtime/library");
const config_js_1 = require("../config/config.js");
const errorMiddleware = (err, req, res, next) => {
    console.error(err);
    // Handle Prisma errors
    if (err instanceof library_1.PrismaClientKnownRequestError) {
        // Handle specific Prisma errors
        switch (err.code) {
            case 'P2002':
                return res.status(409).json({
                    success: false,
                    message: 'Unique constraint violation',
                    error: 'A record with this identifier already exists.'
                });
            case 'P2025':
                return res.status(404).json({
                    success: false,
                    message: 'Record not found',
                    error: 'The requested resource could not be found.'
                });
            default:
                return res.status(500).json({
                    success: false,
                    message: 'Database error',
                    error: config_js_1.config.env === 'development' ? err.message : 'An unexpected database error occurred'
                });
        }
    }
    // Handle custom API errors
    if (err instanceof api_error_js_1.ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors
        });
    }
    // Handle all other errors
    return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: config_js_1.config.env === 'development' ? err.message : 'An unexpected error occurred'
    });
};
exports.errorMiddleware = errorMiddleware;
//# sourceMappingURL=error.middleware.js.map