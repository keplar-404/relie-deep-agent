CREATE TYPE "chat_role" AS ENUM('system', 'user', 'assistant', 'tool');--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"userId" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"sandboxId" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"projectId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"role" "chat_role" NOT NULL,
	"content" text,
	"attachments" jsonb DEFAULT '[]' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "llm_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"chatHistoryId" uuid NOT NULL,
	"projectId" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"type" varchar(255) NOT NULL,
	"toolName" varchar(255),
	"input" jsonb,
	"output" jsonb,
	"attachments" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "image" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "age";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "chat_history" ADD CONSTRAINT "chat_history_projectId_projects_id_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "chat_history" ADD CONSTRAINT "chat_history_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "llm_executions" ADD CONSTRAINT "llm_executions_chatHistoryId_chat_history_id_fkey" FOREIGN KEY ("chatHistoryId") REFERENCES "chat_history"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "llm_executions" ADD CONSTRAINT "llm_executions_projectId_projects_id_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE;