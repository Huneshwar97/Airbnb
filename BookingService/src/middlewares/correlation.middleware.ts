import { NextFunction, Request, Response } from 'express';
import { v4 as uuidV4 } from 'uuid';
import { asyncLocalStorage } from '../utils/helpers/request.helpers';

/**
 * Attaches a correlation ID to every request so log lines from a single
 * request can be tied together (and, in a microservices setup, traced
 * across services that forward the header downstream).
 *
 * If an upstream caller (e.g. an API gateway or another internal service)
 * already sent an `x-correlation-id` header, we honor it instead of
 * generating a new one — that's what lets a single request be traced
 * end-to-end across service boundaries.
 */
export const attachCorrelationIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const incomingCorrelationId = req.headers['x-correlation-id'];
    const correlationId = typeof incomingCorrelationId === 'string' && incomingCorrelationId.length > 0
        ? incomingCorrelationId
        : uuidV4();

    req.headers['x-correlation-id'] = correlationId;
    res.setHeader('x-correlation-id', correlationId);

    asyncLocalStorage.run({ correlationId }, () => {
        next();
    });
}
