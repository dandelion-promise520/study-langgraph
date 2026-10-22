import { db } from "@backend/db";
import { authSessions, users } from "@backend/db/schema";
import { AppError } from "@backend/lib/errors";
import { isPgUniqueViolation } from "@backend/lib/pg-error";
import { UserSchema, type LoginDto, type RegisterDto } from "@lg-lab/types";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";

// session过期时间
const SESSION_TTL_MS = 30 * 24 * 3600 * 1000; // 30 天，

class AuthService {
  async register({ body }: { body: RegisterDto }) {
    const passwordHash = await Bun.password.hash(body.password);

    try {
      const [row] = await db
        .insert(users)
        .values({
          email: body.email,
          name: body.name,
          passwordHash,
        })
        .returning();

      // 剥离成UserSchema的形状，也就是把passwordHash抽出去
      return UserSchema.parse(row);
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

    // 生成一个随机token
    const token = randomBytes(32).toString("base64url");

    // 算出过期时间
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    // 插表
    await db.insert(authSessions).values({
      expiresAt: expiresAt.toISOString(),
      token,
      userId: user.id,
    });

    return { user: UserSchema.parse(user), expiresAt, token };
  }

  async logout({ token }: { token: string }) {
    await db.delete(authSessions).where(eq(authSessions.token, token));
  }
}

export const authService = new AuthService();
