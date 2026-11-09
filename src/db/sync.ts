// Syncs the notes repo into the database. Run with: pnpm sync
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { sourceFromEnv } from "../lib/notes/sources";
import { formatReport, runSync } from "../lib/notes/sync";
import * as schema from "./schema";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. See .env.example.");

  const client = postgres(url, { max: 1 });
  try {
    const db = drizzle(client, { schema });
    const result = await runSync(db, sourceFromEnv());
    console.log(formatReport(result));
    if (result.commit) console.log(`At commit ${result.commit.slice(0, 7)}.`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
