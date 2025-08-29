import { Request, Response, NextFunction } from "express";
import log from "../services/logging/logger";

/**
 * Middleware to handle errors centrally.
 * @param {Error} err - The error object
 * @param {Object} req - Express Request
 * @param {Object} res - Express Response
 * @param {Function} next - Express next function
 */

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    // Log the complete error
    log.error('Server Error:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query
    });

    // Specific Prisma errors
    if (err.code === 'P2023') {  // Prisma validation error
        return res.status(400).json({
            success: false,
            message: 'Invalid data',
            details: err.meta?.message,
        });
    }

    // MongoDB errors (invalid ObjectId)
    if (err.message.includes('Cast to ObjectId failed')) {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID',
        });
    }

    // Standardized response
    res.status(500).json({
        success: false,
        message: 'An error occurred on the server.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
}

export default errorHandler;