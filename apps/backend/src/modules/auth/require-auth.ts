import { db } from "@backend/db";
import { authSessions } from "@backend/db/schema";
import { AppError } from "@backend/lib/errors";
import { and, eq, gt, sql } from "drizzle-orm";
import Elysia from "elysia";

import { clearSessionCookie } from "./session-cookie";

export const requireAuth = new Elysia({ name: "require-auth" }).derive(
  { as: "scoped" },
  async ({ cookie }) => {
    const token = cookie.auth_session?.value;

    if (typeof token !== "string" || token === "") {
      clearSessionCookie({ cookie: cookie.auth_session });
      throw new AppError({ code: "UNAUTHORIZED" });
    }

    const [session] = await db
      .select({ userId: authSessions.userId })
      .from(authSessions)
      .where(and(eq(authSessions.token, token), gt(authSessions.expiresAt, sql`now()`)))
      .limit(1);

    if (!session) {
      clearSessionCookie({ cookie: cookie.auth_session });
      throw new AppError({ code: "UNAUTHORIZED" });
    }

    return { userId: session.userId };
  },
);
