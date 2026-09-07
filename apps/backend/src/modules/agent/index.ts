import { Elysia } from "elysia";

import { agentController } from "./agent.controller";
import { AgentModels } from "./agent.model";

export const agentModule = new Elysia({ prefix: "/agent" })
  .model(AgentModels)
  // 1、普通单次请求
  .post(
    "/chat",
    async ({ body }) => {
      return await agentController.chat(body);
    },
    {
      body: "ChatRequest",
      response: "ChatResponse",
    },
  )
  // 2、sse流式传输
  .post(
    "chatStream",
    ({ body }) => {
      return agentController.chatStream(body);
    },
    {
      body: "ChatRequest",
    },
  );
