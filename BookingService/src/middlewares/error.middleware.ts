import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors/app.error";
import logger from "../config/logger.config";

/**
 * Handles known, "expected" application errors (anything thrown as an
 * `AppError` — `BadRequestError`, `NotFoundError`, etc.). These already
 * carry a safe, user-facing `message` and the correct HTTP `statusCode`,
 * so we can return them to the client as-is.
 *
 * Must be registered *before* `genericErrorHandler` in server.ts: Express
 * runs error-handling middleware in order and stops at the first one that
 * sends a response, so this acts as a "catch AppErrors first" filter.
 */
export const appErrorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
    // An `AppError` always has a numeric statusCode; anything else (a plain
    // `Error`, a thrown string, etc.) isn't one of ours — pass it on to the
    // generic handler below rather than risk responding with `undefined`
    // as the status code.
    if (typeof err.statusCode !== 'number') {
        next(err);
        return;
    }

    logger.warn(`Handled application error: ${err.message}`, {
        statusCode: err.statusCode,
        name: err.name,
    });

    res.status(err.statusCode).json({
        success: false,
        message: err.message
    });
}

/**
 * Last-resort handler for anything not already handled above — unexpected
 * exceptions, bugs, third-party library errors, etc. Logs the full error
 * (including stack trace) server-side for debugging, but only ever returns
 * a generic message to the client so internal details are never leaked.
 */
export const genericErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });

    res.status(500).json({
        success: false,
        message: "Internal Server Error"
    });
}
