// Inserts (or refreshes) the sample scripts. Run with: pnpm db:seed
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { scripts } from "./schema";

const SAMPLE_SCRIPTS = [
  {
    title: "Terraform basics",
    topic: "Terraform",
    file: "terraform-basics.md",
  },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. See .env.example.");

  const client = postgres(url, { max: 1 });
  const db = drizzle(client);

  for (const sample of SAMPLE_SCRIPTS) {
    const content = readFileSync(
      join(import.meta.dirname, "seed-data", sample.file),
      "utf8",
    ).trim();

    const [existing] = await db
      .select({ id: scripts.id })
      .from(scripts)
      .where(and(eq(scripts.title, sample.title), eq(scripts.topic, sample.topic)));

    if (existing) {
      await db
        .update(scripts)
        .set({ content, updatedAt: new Date() })
        .where(eq(scripts.id, existing.id));
      console.log(`Updated: ${sample.title}`);
    } else {
      await db
        .insert(scripts)
        .values({ title: sample.title, topic: sample.topic, content });
      console.log(`Inserted: ${sample.title}`);
    }
  }

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
