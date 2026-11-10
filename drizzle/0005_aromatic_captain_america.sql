CREATE TABLE "collections" (
	"slug" text PRIMARY KEY NOT NULL,
	"folder" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"position" integer,
	"meta_path" text,
	"meta_hash" text,
	"cover_path" text,
	"cover_hash" text,
	"cover_type" text,
	"cover_data" "bytea",
	"removed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scripts" ADD COLUMN "collection" text DEFAULT 'unfiled' NOT NULL;--> statement-breakpoint
CREATE INDEX "scripts_collection_idx" ON "scripts" USING btree ("collection");--> statement-breakpoint
-- Fill the new column from the path each script already has, so the library is
-- right before the next sync runs. The sync replaces this with its own answer,
-- including for folder names this simple version of slugify cannot handle.
UPDATE "scripts"
SET "collection" = coalesce(
  nullif(
    trim(both '-' from lower(regexp_replace(split_part("script_path", '/', 2), '[^a-zA-Z0-9]+', '-', 'g'))),
    ''
  ),
  'unfiled'
)
WHERE "script_path" LIKE 'scripts/%/%';