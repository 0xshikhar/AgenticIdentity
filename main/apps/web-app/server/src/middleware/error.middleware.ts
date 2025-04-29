// server/src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { config } from '../config/config';

export const errorMiddleware = (
    err: Error | ApiError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error(err);

    // Handle Prisma errors
    if (err instanceof PrismaClientKnownRequestError) {
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
                    error: config.env === 'development' ? err.message : 'An unexpected database error occurred'
                });
        }
    }

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