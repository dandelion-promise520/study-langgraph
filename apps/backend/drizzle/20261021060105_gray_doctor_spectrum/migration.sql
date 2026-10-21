CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"userId" uuid NOT NULL,
	"token" text NOT NULL UNIQUE,
	"expiresAt" timestamp with time zone NOT NULL,
	"ipAddress" text,
	"userAgent" text
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "passwordHash" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "emailVerified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "threads" ALTER COLUMN "userId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "auth_sessions_userId_idx" ON "auth_sessions" ("userId");--> statement-breakpoint
CREATE INDEX "messages_threadId_idx" ON "messages" ("threadId");--> statement-breakpoint
CREATE INDEX "threads_userId_idx" ON "threads" ("userId");--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "threads" DROP CONSTRAINT "threads_userId_users_id_fkey", ADD CONSTRAINT "threads_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;