import { NextFunction, Request, Response } from "express";
import { z, ZodError } from "zod";
import logger from "../config/logger.config";

// NOTE: `AnyZodObject` was removed in Zod v4 (in favour of the more general
// `ZodType`). `z.ZodType` accepts any schema built with `z.object(...)`,
// `z.union(...)`, etc., which keeps these helpers usable for every schema
// in the app, not just plain objects.

/**
 * Formats a ZodError into a small, client-safe array of field/message pairs
 * instead of leaking the full internal error object (stack traces, zod
 * internals, etc.) back to the caller.
 */
const formatZodError = (error: ZodError) =>
    error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
    }));

/**
 * 
 * @param schema - Zod schema to validate the request body
 * @returns - Middleware function to validate the request body
 */
export const validateRequestBody = (schema: z.ZodType) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {

            logger.info("Validating request body");
            req.body = await schema.parseAsync(req.body);
            logger.info("Request body is valid");
            next();

        } catch (error) {
            if (error instanceof ZodError) {
                logger.error("Request body is invalid", { errors: formatZodError(error) });
                res.status(400).json({
                    message: "Invalid request body",
                    success: false,
                    errors: formatZodError(error),
                });
                return;
            }

            // Unexpected (non-validation) error while validating — surface it to
            // the centralized error handlers instead of silently returning 400.
            logger.error("Unexpected error while validating request body", { error });
            next(error);
        }
    }
}

/**
 * 
 * @param schema - Zod schema to validate the request query params
 * @returns - Middleware function to validate the request query params
 */
export const validateQueryParams = (schema: z.ZodType) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {

            await schema.parseAsync(req.query);
            logger.info("Query params are valid");
            next();

        } catch (error) {
            if (error instanceof ZodError) {
                logger.error("Query params are invalid", { errors: formatZodError(error) });
                res.status(400).json({
                    message: "Invalid query params",
                    success: false,
                    errors: formatZodError(error),
                });
                return;
            }

            logger.error("Unexpected error while validating query params", { error });
            next(error);
        }
    }
}
