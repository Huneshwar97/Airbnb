import type {Request,Response}from "express"
import {createBookingService,confirmBookingService} from "../services/booking.service"
import {BadRequestError} from "../utils/errors/app.error"

/**
 * POST /api/v1/bookings
 *
 * Creates a new (PENDING) booking and issues an idempotency key that the
 * client must use to confirm it. The heavy lifting (distributed locking,
 * persistence) lives in `createBookingService`; this handler is intentionally
 * a thin adapter between HTTP and the service layer.
 *
 * Note: this handler has no try/catch. Express 5 automatically forwards
 * rejected promises from async route handlers to the error-handling
 * middleware (`appErrorHandler` / `genericErrorHandler` in server.ts), so
 * throwing here is sufficient — we don't need to catch and call `next()`
 * manually as we would have under Express 4.
 */
export const createBookingHandler = async (req: Request, res: Response) => {

    const booking = await createBookingService(req.body);

    res.status(201).json({
        bookingId: booking.bookingId,
        idempotencyKey: booking.idempotencyKey,
    });
}


/**
 * POST /api/v1/bookings/confirm/:idempotencyKey
 *
 * Confirms a previously created booking using its idempotency key.
 */
export const confirmBookingHandler = async (req: Request, res: Response) => {
    const { idempotencyKey } = req.params;

    // `req.params` values are typed as `string | string[]` by Express (route
    // patterns like `:id*` can capture repeated segments), even though this
    // route only ever declares a single `:idempotencyKey` segment. Guard
    // explicitly rather than casting, so a malformed URL fails fast with a
    // clear 400 instead of an obscure downstream type/runtime error.
    if (typeof idempotencyKey !== 'string' || idempotencyKey.length === 0) {
        throw new BadRequestError('idempotencyKey path parameter must be a single string');
    }

    const booking = await confirmBookingService(idempotencyKey);

    res.status(200).json({
        bookingId: booking.id,
        status: booking.status,
    });
}
