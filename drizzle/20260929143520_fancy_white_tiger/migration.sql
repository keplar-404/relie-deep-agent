ALTER TABLE "users" ADD COLUMN "clerkId" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "image" text DEFAULT '/sass.jpg';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "logo" varchar(255);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "status" varchar(50) DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_clerkId_key" UNIQUE("clerkId");