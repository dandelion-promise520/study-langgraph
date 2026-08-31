import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";

import { env } from "./config/env";
import { agentModule } from "./modules/agent";

const app = new Elysia()
  .use(cors())
  .use(agentModule)
  .get("/", () => ({
    status: "ok",
    service: "LangGraph Elysia Backend",
    timestamp: new Date().toISOString(),
  }))
  .listen(env.PORT);

console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
