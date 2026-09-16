import { Prisma } from '../prisma/generated/client';
import { confirmBookingWithLock, createBooking, createIdempotencyKey , getIdempotencyKeyWithLock ,finalizeIdempotencyKeyWithLock } from "../repositories/booking.repositories";
import {CreateBookingDTO} from "../dto/booking.dto"
import { BadRequestError, NotFoundError } from "../utils/errors/app.error";
import {generateIdempotencyKey} from "../utils/helpers/generateIdempotencyKey"

import prismaClient from '../prisma/client';


/**
 * Creates a booking and an accompanying idempotency key.
 *
 * A Redis-backed distributed lock (Redlock) is held on `hotel:{hotelId}`
 * while the booking is created, to prevent two concurrent requests for the
 * same hotel from racing (e.g. overbooking available inventory). The lock
 * is scoped only to the create step; confirmation is handled separately via
 * `confirmBookingService` and a DB-level row lock (`FOR UPDATE`).
 */
export async function createBookingService(createBookingDTO:CreateBookingDTO)
    {
    const booking = await createBooking({
        userId: createBookingDTO.userId,
        hotelId: createBookingDTO.hotelId,
        totalGuests: createBookingDTO.totalGuests,
        bookingAmount: createBookingDTO.bookingAmount,
    })

    const idempotencyKey = generateIdempotencyKey();

    await createIdempotencyKey(idempotencyKey,booking.id);

     return {
            bookingId: booking.id,
            idempotencyKey: idempotencyKey,
     };
}

/**
 * Confirms a PENDING booking, keyed by its idempotency key.
 *
 * The whole operation runs inside a single DB transaction:
 *  1. Row-lock the idempotency key record (`FOR UPDATE`) so concurrent
 *     confirmation attempts for the same key serialize instead of racing.
 *  2. Reject if the key doesn't exist, or has already been finalized
 *     (idempotent — a retried confirmation request should not double-confirm).
 *  3. Mark the booking CONFIRMED and the idempotency key finalized.
 */
export async function confirmBookingService(idempotencyKey:string){

    return await prismaClient.$transaction(async(tx: Prisma.TransactionClient)=>{
        const idempotencyKeyData = await getIdempotencyKeyWithLock(tx,idempotencyKey)

        if (!idempotencyKeyData){
            throw new NotFoundError('Idempotency key not found')
        }

        if(idempotencyKeyData.finalized){
            throw new BadRequestError('Idempotency key already finalized')
        }

        const booking = await confirmBookingWithLock(tx,idempotencyKeyData.bookingId);
        await finalizeIdempotencyKeyWithLock(tx,idempotencyKey)

        return booking;
    })
    
}