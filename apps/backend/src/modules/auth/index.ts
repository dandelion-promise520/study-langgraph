import { UserSchema } from "@lg-lab/types";
import Elysia from "elysia";

import { authController } from "./auth.controller";
import { AuthModels } from "./auth.model";

export const authModule = new Elysia({ prefix: "/auth" })
  .model(AuthModels)
  .post(
    "/register",
    ({ body, set }) => {
      set.status = 201;
      return authController.register({ body });
    },
    { body: "Register", response: { 201: UserSchema } },
  )
  .post(
    "/login",
    async ({ body, cookie }) => {
      const { user, token, expiresAt } = await authController.login({ body });
      cookie.auth_session?.set({
        value: token,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        expires: expiresAt,
      });

      return user;
    },
    { body: "Login", response: { 200: UserSchema } },
  )
  .delete("/logout", async ({ cookie }) => {
    const token = cookie.auth_session?.value;

    if (typeof token === "string" && token !== "") {
      await authController.logout({ token });
    }

    cookie.auth_session?.remove();

    return { success: true };
  });
