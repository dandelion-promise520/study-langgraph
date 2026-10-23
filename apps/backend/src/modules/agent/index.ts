import { Elysia } from "elysia";

import { requireAuth } from "../auth/require-auth";
import { agentController } from "./agent.controller";
import { AgentModels } from "./agent.model";

export const agentModule = new Elysia({ prefix: "/agent" })
  .use(requireAuth)
  .model(AgentModels)
  // 1、普通单次请求
  .post("/chat", ({ body, userId }) => agentController.chat({ body, userId }), {
    body: "ChatRequest",
    response: "ChatResponse",
  })
  // 2、sse流式传输
  .post("/chat/stream", ({ body, userId }) => agentController.chatStream({ body, userId }), {
    body: "ChatRequest",
  });
