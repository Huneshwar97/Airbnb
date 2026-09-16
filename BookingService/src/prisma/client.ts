import { PrismaClient } from "./generated/client";

/**
 * Single shared PrismaClient instance for the whole process.
 *
 * IMPORTANT: do not call `new PrismaClient()` anywhere else in the app —
 * each instance opens its own connection pool, and creating multiple
 * instances (e.g. one per request) will quickly exhaust the database's
 * max-connections limit under load.
 */
export default new PrismaClient();