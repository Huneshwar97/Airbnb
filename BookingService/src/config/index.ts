// This file contains all the basic configuration logic for the app server to work
import dotenv from 'dotenv';

type ServerConfig = {
    PORT: number,
}

function loadEnv() {
    dotenv.config();
}

loadEnv();

/**
 * Reads a required environment variable, throwing at startup if it is
 * missing rather than letting the app boot into a half-configured state
 * and fail confusingly later (e.g. on the first DB/Redis call).
 */
function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

// NOTE: DATABASE_URL is consumed directly by Prisma (via `env("DATABASE_URL")`
// in schema.prisma), so it isn't part of `ServerConfig`, but it's just as
// required for the app to function — validate it here too so a missing
// value fails fast at boot instead of on the first query.
requireEnv('DATABASE_URL');

export const serverConfig: ServerConfig = {
    PORT: Number(process.env.PORT) || 3001,
};
