import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const scripts = pgTable("scripts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  topic: text("topic").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Script = typeof scripts.$inferSelect;
export type NewScript = typeof scripts.$inferInsert;
