"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const api_error_js_1 = require("../utils/api-error.js");
const config_js_1 = require("../config/config.js");
const errorMiddleware = (err, req, res, next) => {
    console.error(err);
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