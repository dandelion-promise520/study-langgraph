import { AppError } from "@backend/lib/errors";
import Elysia from "elysia";

export const requireUser = new Elysia({ name: "require-user" }).derive(
  { as: "scoped" },
  ({ headers }) => {
    const userId = headers["x-user-id"];

    if (!userId) throw new AppError({ code: "UNAUTHORIZED" });

    return { userId };
  },
);
