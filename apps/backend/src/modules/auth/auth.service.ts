import { db } from "@backend/db";
import { authSessions, users } from "@backend/db/schema";
import { AppError } from "@backend/lib/errors";
import { isPgUniqueViolation } from "@backend/lib/pg-error";
import { UserSchema, type LoginDto, type RegisterDto, type UserDto } from "@lg-lab/types";
import { randomBytes } from "crypto";
import { and, eq, lt, sql } from "drizzle-orm";

// session过期时间
const SESSION_TTL_MS = 30 * 24 * 3600 * 1000; // 30 天，

type Transaction = Parameters<Parameters<(typeof db)["transaction"]>[0]>[0];

class AuthService {
  private async createSession({ tx, userId }: { tx: Transaction; userId: string }) {
    // 生成一个随机token
    const token = randomBytes(32).toString("base64url");

    // 算出过期时间
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    // 顺手清下过期的token行
    await tx
      .delete(authSessions)
      .where(and(eq(authSessions.userId, userId), lt(authSessions.expiresAt, sql`now()`)));

    // 插表
    await tx.insert(authSessions).values({
      expiresAt: expiresAt,
      token,
      userId: userId,
    });

    return { expiresAt, token };
  }

  async register({ body }: { body: RegisterDto }) {
    const passwordHash = await Bun.password.hash(body.password);

    try {
      return await db.transaction(async (tx) => {
        const [row] = await tx
          .insert(users)
          .values({
            email: body.email,
            name: body.name,
            passwordHash,
          })
          .returning();

        const user = UserSchema.parse(row);
        // 注册后自动登录
        const session = await this.createSession({ tx, userId: user.id });

        // 剥离成UserSchema的形状，也就是把passwordHash抽出去
        return { user, ...session };
      });
    } catch (e) {
      if (isPgUniqueViolation({ err: e, constraintName: "users_email_key" })) {
        throw new AppError({ code: "EMAIL_TAKEN", cause: e });
      }

      throw e;
    }
  }

  async login({ body }: { body: LoginDto }) {
    // 拿邮箱到表里查下
    const [user] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);

    // 没有查到用户就报错
    if (!user) {
      throw new AppError({ code: "INVALID_CREDENTIALS" });
    }

    // 密码不匹配就报错
    const matched = await Bun.password.verify(body.password, user.passwordHash);

    if (!matched) {
      throw new AppError({ code: "INVALID_CREDENTIALS" });
    }

    // 发session
    const session = await db.transaction(async (tx) => this.createSession({ tx, userId: user.id }));

    return { user: UserSchema.parse(user), ...session };
  }

  async logout({ token }: { token: string }) {
    await db.delete(authSessions).where(eq(authSessions.token, token));
  }

  async getCurrentUser({ userId }: { userId: string }): Promise<UserDto> {
    const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!row) throw new AppError({ code: "UNAUTHORIZED" });

    return UserSchema.parse(row);
  }
}

export const authService = new AuthService();
