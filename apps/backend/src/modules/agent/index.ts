import { Elysia } from "elysia";

import { agentController } from "./agent.controller";
import { AgentModels } from "./agent.model";

export const agentModule = new Elysia({ prefix: "/agent" }).model(AgentModels).post(
  "/chat",
  async ({ body }) => {
    return await agentController.chat(body);
  },
  {
    body: "ChatRequest",
    response: "ChatResponse",
  },
);
