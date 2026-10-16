CREATE TYPE "message_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"threadId" uuid NOT NULL,
	"role" "message_role" NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "threads" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"title" text DEFAULT '新会话' NOT NULL,
	"userId" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"email" text NOT NULL UNIQUE,
	"name" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_threadId_threads_id_fkey" FOREIGN KEY ("threadId") REFERENCES "threads"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "threads" ADD CONSTRAINT "threads_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL;