import { Elysia } from "elysia";

import { requireUser } from "../auth/require-user";
import { agentController } from "./agent.controller";
import { AgentModels } from "./agent.model";

export const agentModule = new Elysia({ prefix: "/agent" })
  .use(requireUser)
  .model(AgentModels)
  // 1、普通单次请求
  .post(
    "/chat",
    async ({ body, userId }) => {
      return await agentController.chat({ body, userId });
    },
    {
      body: "ChatRequest",
      response: "ChatResponse",
    },
  )
  // 2、sse流式传输
  .post(
    "/chat/stream",
    ({ body, userId }) => {
      return agentController.chatStream({ body, userId });
    },
    {
      body: "ChatRequest",
    },
  );
