import { Prisma , IdempotencyKey } from "../prisma/generated/client";
import prismaClient from "../prisma/client";   // relative path to the file above
import { validate as isValidUUID } from "uuid";
import { BadRequestError,NotFoundError }from "../utils/errors/app.error"


/**
 * @file booking.repository.ts
 * Data-access layer for bookings and their idempotency keys. Keeps all
 * direct Prisma usage in one place so the service layer works against
 * plain, intention-revealing function names instead of raw ORM calls.
 */

/** Creates a new booking row. Defaults to PENDING status via the Prisma schema. */
export async function createBooking(bookingInput: Prisma.BookingCreateInput){ 
    const booking = await prismaClient.booking.create({
        data : bookingInput
    })
    return booking;
}

/** Links an idempotency key to the booking it was issued for. */
export async function createIdempotencyKey(key: string,bookingId :number){
    const idempotencyKey = await prismaClient.idempotencyKey.create({
        data:{
            idemKey:key,
            booking:{
                connect :{
                    id : bookingId
                }
            }
        }
    })
    return idempotencyKey;
}

export async function getIdempotencyKeyWithLock(tx: Prisma.TransactionClient,key:string,){

    if(!isValidUUID(key)) {
        throw new BadRequestError("Invalid idempotency key format");
    }

    // Use Prisma's tagged-template `$queryRaw` (parameterized query) instead of
    // `Prisma.raw()` string interpolation. `Prisma.raw` inlines the value directly
    // into the SQL string with no escaping, which is a SQL-injection vector even
    // when the value has been validated elsewhere. `$queryRaw` sends `key` as a
    // bound parameter, so it is always safely escaped by the underlying driver.
    // `FOR UPDATE` takes a row-level lock for the lifetime of the transaction,
    // which is what makes this call safe to use for idempotent booking confirmation.
    const idempotencyKey: Array<IdempotencyKey> = await tx.$queryRaw`SELECT * FROM IdempotencyKey WHERE idemKey = ${key} FOR UPDATE;`;

    if(!idempotencyKey || idempotencyKey.length === 0) {
        throw new NotFoundError("Idempotency key not found");
    }

    return idempotencyKey[0];
}

/** Fetches a single booking by its primary key, or `null` if it doesn't exist. */
export async function getBookingById(bookingId:number){
    const booking = await prismaClient.booking.findUnique({
        where:{
            id : bookingId
        }
    })
    return booking
}

/** Marks a booking CONFIRMED. Expected to run inside the same transaction as `getIdempotencyKeyWithLock`. */
export async function confirmBookingWithLock( tx: Prisma.TransactionClient,bookingId: number) {
    const booking = await tx.booking.update({
        where: {
            id: bookingId
        },
        data: {
            status: "CONFIRMED"
        }
    });
    return booking;
}

/**
 * Marks a booking CANCELLED.
 * TODO: not yet wired up to any route/service — add a cancel endpoint once
 * cancellation rules (refunds, cutoff windows, etc.) are defined.
 */
export async function cancelBooking(bookingId: number) {
    const booking = await prismaClient.booking.update({
        where: {
            id: bookingId
        },
        data: {
            status: "CANCELLED"
        }
    });
    return booking;
}



/** Marks an idempotency key as finalized so it cannot be used to confirm a booking again. */
export async function finalizeIdempotencyKeyWithLock(tx:Prisma.TransactionClient, key: string) {
    const idempotencyKey = await tx.idempotencyKey.update({
        where: {
            idemKey: key
        },
        data: {
            finalized: true
        }
    });

    return idempotencyKey;
}



















// export async function changeBookingStatus(bookingId:number,
//     status:Prisma.EnumBookingStatusFieldUpdateOperationsInput){
//     const booking = await prismaClient.booking.update({
//         where:{
//             id:bookingId
//         },
//         data:{
//             status:status
//         }
//     })
//     return booking
// }




/**
 * 1. booking => idempotencyKey(sequencial) (if booking fail everything fails)
 * 2. booking | idempotency + update IdempotencyKey add the bookings(if update fail retry machanize)
 * 
 */