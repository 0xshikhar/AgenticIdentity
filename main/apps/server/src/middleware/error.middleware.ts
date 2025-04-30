// server/src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error.js';
import { config } from '../config/config.js';

export const errorMiddleware = (
    err: Error | ApiError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error(err);

    // Handle custom API errors
    if (err instanceof ApiError) {
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
        error: config.env === 'development' ? err.message : 'An unexpected error occurred'
    });
};