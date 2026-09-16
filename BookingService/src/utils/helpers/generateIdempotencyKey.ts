import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a random idempotency key (UUID v4) for a newly created booking.
 * The client must present this key back to `/bookings/confirm/:idempotencyKey`
 * to confirm the booking, and the key can safely be retried without side
 * effects once it has been finalized (see `confirmBookingService`).
 */
export function generateIdempotencyKey(): string {
    return uuidv4();
}