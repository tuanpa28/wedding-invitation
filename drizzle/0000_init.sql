CREATE TYPE "public"."event_side" AS ENUM('bride', 'groom', 'both');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('an_hoi', 'vu_quy', 'thanh_hon', 'tiec_cuoi', 'khac');--> statement-breakpoint
CREATE TYPE "public"."guest_side" AS ENUM('bride', 'groom');--> statement-breakpoint
CREATE TYPE "public"."wedding_status" AS ENUM('draft', 'published', 'locked');--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" uuid NOT NULL,
	"side" "event_side" NOT NULL,
	"type" "event_type" NOT NULL,
	"title" text NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"venue" text NOT NULL,
	"address" text NOT NULL,
	"map_url" text,
	"lunar_text" text,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" uuid NOT NULL,
	"code" text NOT NULL,
	"side" "guest_side" NOT NULL,
	"display_name" text NOT NULL,
	"phone" text,
	"group_tag" text,
	"max_attendees" integer,
	"first_opened_at" timestamp with time zone,
	"open_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" uuid NOT NULL,
	"src" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"alt" text DEFAULT '' NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wedding_id" uuid NOT NULL,
	"date_label" text NOT NULL,
	"title" text NOT NULL,
	"text" text NOT NULL,
	"photo" jsonb,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"status" "wedding_status" DEFAULT 'draft' NOT NULL,
	"template_id" text DEFAULT 'song-hy' NOT NULL,
	"groom" jsonb NOT NULL,
	"bride" jsonb NOT NULL,
	"quote" text,
	"cover" jsonb NOT NULL,
	"music_url" text,
	"theme" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "weddings_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guests" ADD CONSTRAINT "guests_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_items" ADD CONSTRAINT "story_items_wedding_id_weddings_id_fk" FOREIGN KEY ("wedding_id") REFERENCES "public"."weddings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_wedding_id_idx" ON "events" USING btree ("wedding_id");--> statement-breakpoint
CREATE UNIQUE INDEX "guests_wedding_code_uq" ON "guests" USING btree ("wedding_id","code");--> statement-breakpoint
CREATE INDEX "photos_wedding_id_idx" ON "photos" USING btree ("wedding_id");--> statement-breakpoint
CREATE INDEX "story_items_wedding_id_idx" ON "story_items" USING btree ("wedding_id");