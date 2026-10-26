import { db } from "@backend/db";
import { authSessions } from "@backend/db/schema";
import { AppError } from "@backend/lib/errors";
import { and, eq, gt, sql } from "drizzle-orm";
import Elysia, { type Context } from "elysia";

import { clearSessionCookie } from "./session-cookie";

export const resolveSession = async ({ cookie }: { cookie: Context["cookie"] }) => {
  const rawToken = cookie.auth_session?.value;

  const token = typeof rawToken === "string" && rawToken !== "" ? rawToken : null;

  if (!token) return null;

  const [session] = await db
    .select({ userId: authSessions.userId })
    .from(authSessions)
    .where(and(eq(authSessions.token, token), gt(authSessions.expiresAt, sql`now()`)))
    .limit(1);

  if (!session) {
    clearSessionCookie({ cookie: cookie.auth_session });
    return null;
  }

  return session.userId;
};

export const requireAuth = new Elysia({ name: "require-auth" }).derive(
  { as: "scoped" },
  async ({ cookie }) => {
    const userId = await resolveSession({ cookie });

    if (!userId) throw new AppError({ code: "UNAUTHORIZED" });

    return { userId };
  },
);
