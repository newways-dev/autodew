ALTER TABLE "workflows" ADD COLUMN "schedule_cron" text;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "schedule_timezone" text;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "schedule_trigger_id" text;