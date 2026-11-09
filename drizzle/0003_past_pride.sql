ALTER TABLE "sync_state" ADD COLUMN "playlist" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "sync_state" ADD COLUMN "playlist_hash" text;