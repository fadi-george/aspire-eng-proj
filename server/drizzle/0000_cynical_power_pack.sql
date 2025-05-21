CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"github_id" integer NOT NULL,
	"username" varchar(255) NOT NULL,
	"name" varchar(255),
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_github_id_unique" UNIQUE("github_id")
);
--> statement-breakpoint
CREATE INDEX "github_id_idx" ON "users" USING btree ("github_id");