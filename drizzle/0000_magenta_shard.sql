CREATE TABLE "actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text NOT NULL,
	"kpi_id" integer,
	"title" text NOT NULL,
	"score" integer DEFAULT 3,
	"is_user_added" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "daily_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_device_id" uuid NOT NULL,
	"action_external_id" text NOT NULL,
	"completed_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text NOT NULL,
	"user_device_id" uuid NOT NULL,
	"title" text NOT NULL,
	"current_status" text,
	"duration" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kpis" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_id" text NOT NULL,
	"goal_id" integer,
	"title" text NOT NULL,
	"display_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"device_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_seen" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_device_id_unique" UNIQUE("device_id")
);
--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_kpi_id_kpis_id_fk" FOREIGN KEY ("kpi_id") REFERENCES "public"."kpis"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpis" ADD CONSTRAINT "kpis_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;