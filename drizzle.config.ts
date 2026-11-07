import { defineConfig } from "drizzle-kit";

// drizzle-kit does not load Next.js env files, so load .env.local ourselves.
try {
  process.loadEnvFile(".env.local");
} catch {
  // Fall back to variables already set in the environment.
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
