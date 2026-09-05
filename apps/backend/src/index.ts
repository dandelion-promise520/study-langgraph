import openapi from "@elysia/openapi";
import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { zodToJsonSchema } from "zod-to-json-schema";

import { env } from "./config/env";
import { agentModule } from "./modules/agent";

const app = new Elysia()
  .use(cors())
  .use(
    openapi({
      mapJsonSchema: {
        zod: zodToJsonSchema,
      },
    }),
  )
  .use(agentModule)
  .get("/", () => ({
    status: "ok",
    service: "LangGraph Elysia Backend",
  }))
  .listen(env.PORT);

console.log(`🦊 Elysia 已启动: http://localhost:${env.PORT}`);
console.log(`openapi已启动: http://localhost:${env.PORT}/openapi`);

export type App = typeof app;
