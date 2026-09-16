/** Request payload for `POST /api/v1/bookings`.
 *  Validated by `createBookingSchema` before reaching the service layer. */

export type CreateBookingDTO = {
    userId: number;
    hotelId: number;
    totalGuests: number;
    bookingAmount: number;
}
