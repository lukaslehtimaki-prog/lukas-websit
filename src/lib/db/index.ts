import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { env } from "@/lib/env";

/**
 * Service-role database client (Drizzle + postgres.js).
 *
 * ⚠️  This connects with the Postgres connection string and BYPASSES Row-Level Security.
 * Use it ONLY for trusted server-side/system work that legitimately needs to cross tenant
 * boundaries — e.g. the platform-admin view and seed scripts. For all normal, user-facing
 * data access use the RLS-enforced Supabase client (src/lib/supabase/server.ts) instead.
 */
let _client: ReturnType<typeof postgres> | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getAdminDb() {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set (see .env.example).");
  }
  if (!_db) {
    _client = postgres(env.DATABASE_URL, { prepare: false });
    _db = drizzle(_client, { schema });
  }
  return _db;
}

export { schema };
