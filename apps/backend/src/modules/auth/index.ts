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
  .post("/login", ({ body }) => authController.login({ body }), { body: "Login" });
