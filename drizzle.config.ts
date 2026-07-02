import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// The canonical migration (tables + RLS + signup trigger + seeds) is hand-written at
// supabase/migrations/0001_init.sql because it references Supabase's auth schema and RLS,
// which drizzle-kit does not manage. drizzle-kit is configured here for optional
// `introspect` / `studio` use against the same database.
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
  },
});
