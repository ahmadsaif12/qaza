import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not configured');
}

const databaseSsl =
  process.env.DATABASE_SSL === 'true' || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' }
    : false;

const sql = postgres(databaseUrl, {
  ssl: databaseSsl,
});

export function getDb() {
  return db;
}

export const db = drizzle({ client: sql, schema });
