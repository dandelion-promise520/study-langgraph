import { db } from "@backend/db";
import { users } from "@backend/db/schema";
import { AppError } from "@backend/lib/errors";
import { isPgUniqueViolation } from "@backend/lib/pg-error";
import { UserSchema, type LoginDto, type RegisterDto } from "@lg-lab/types";
import { eq } from "drizzle-orm";

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
    const [user] = await db
      .select({
        id: users.id,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1);

    if (!user) {
      throw new AppError({ code: "INVALID_CREDENTIALS" });
    }

    const matched = await Bun.password.verify(body.password, user.passwordHash);

    if (!matched) {
      throw new AppError({ code: "INVALID_CREDENTIALS" });
    }
  }
}

export const authService = new AuthService();
