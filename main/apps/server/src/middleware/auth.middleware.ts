// server/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import { ApiError } from '../utils/api-error.js';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        address: string;
        role: string;
    };
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new ApiError(401, 'Authentication required'));
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify token
        const decoded = jwt.verify(token, config.jwt.secret) as {
            id: string;
            address: string;
            role: string;
        };

        // Add user to request
        (req as AuthRequest).user = decoded;

        next();
    } catch (error) {
        return next(new ApiError(401, 'Invalid or expired token'));
    }
};

// Middleware to check if user has admin role
export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;

    if (!authReq.user || authReq.user.role !== 'admin') {
        return next(new ApiError(403, 'Admin access required'));
    }

    next();
};