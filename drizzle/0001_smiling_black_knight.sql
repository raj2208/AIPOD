-- scripts is now a cache of the notes repo (see docs/architecture.md).
-- Old rows have no source info, so clear them; `pnpm sync` rebuilds the table.
DELETE FROM "scripts";--> statement-breakpoint
CREATE TABLE "sync_state" (
	"id" text PRIMARY KEY NOT NULL,
	"commit" text,
	"synced_at" timestamp with time zone NOT NULL,
	"report" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scripts" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "scripts" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "scripts" ADD COLUMN "status" text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "scripts" ADD COLUMN "script_path" text NOT NULL;--> statement-breakpoint
ALTER TABLE "scripts" ADD COLUMN "script_hash" text NOT NULL;--> statement-breakpoint
ALTER TABLE "scripts" ADD COLUMN "note_path" text NOT NULL;--> statement-breakpoint
ALTER TABLE "scripts" ADD COLUMN "source_hash" text NOT NULL;--> statement-breakpoint
ALTER TABLE "scripts" ADD COLUMN "note_hash" text;--> statement-breakpoint
ALTER TABLE "scripts" ADD COLUMN "model" text;--> statement-breakpoint
ALTER TABLE "scripts" ADD COLUMN "skill_version" text;--> statement-breakpoint
ALTER TABLE "scripts" ADD COLUMN "removed_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "scripts_script_path_idx" ON "scripts" USING btree ("script_path");