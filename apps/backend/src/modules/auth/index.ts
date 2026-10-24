import { UserSchema } from "@lg-lab/types";
import Elysia from "elysia";

import { authController } from "./auth.controller";
import { AuthModels } from "./auth.model";
import { requireAuth } from "./require-auth";
import { clearSessionCookie, setSessionCookie } from "./session-cookie";

export const authModule = new Elysia({ prefix: "/auth" })
  .model(AuthModels)
  .post(
    "/register",
    async ({ body, set, cookie }) => {
      const { expiresAt, token, user } = await authController.register({ body });

      // 注册后自动登录
      setSessionCookie({ cookie: cookie.auth_session, expiresAt, token });

      set.status = 201;
      return user;
    },
    { body: "Register", response: { 201: UserSchema } },
  )
  .post(
    "/login",
    async ({ body, cookie }) => {
      const { user, token, expiresAt } = await authController.login({ body });

      setSessionCookie({ cookie: cookie.auth_session, expiresAt, token });

      return user;
    },
    { body: "Login", response: { 200: UserSchema } },
  )
  .delete("/logout", async ({ cookie, set }) => {
    const token = cookie.auth_session?.value;

    if (typeof token === "string" && token !== "") {
      await authController.logout({ token });
    }

    clearSessionCookie({ cookie: cookie.auth_session });

    set.status = 204;
  })
  .use(requireAuth)
  .get("/me", ({ userId }) => authController.getCurrentUser({ userId }), {
    response: { 200: UserSchema },
    detail: { security: [{ cookieAuth: [] }] },
  });
