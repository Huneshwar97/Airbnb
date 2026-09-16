import express from 'express';
import bookingRouter from './booking.router';

/** Aggregates all v1 sub-routers. Mounted at `/api/v1` in server.ts. */
const v1Router = express.Router();

v1Router.use('/bookings', bookingRouter);

export default v1Router;