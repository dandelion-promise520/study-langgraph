import { Elysia } from "elysia";

import { AgentModels } from "./agent.model";
import { agentService } from "./agent.service";

export const agentModule = new Elysia({ prefix: "/agent" })
  .model(AgentModels)
  .post(
    "/chat",
    async ({ body }) => {
      const { message, threadId = "default-thread" } = body;
      return await agentService.chat(message, threadId);
    },
    {
      body: "ChatRequest",
      response: "ChatResponse",
      detail: {
        tags: ["Agent"],
        summary: "发送单次对话消息并等待完整回复",
      },
    },
  )
  .post(
    "/chat/stream",
    async function* ({ body, set }) {
      set.headers["content-type"] = "text/event-stream";
      set.headers["cache-control"] = "no-cache";
      set.headers["connection"] = "keep-alive";

      const { message, threadId = "default-thread" } = body;
      yield* agentService.chatStream(message, threadId);
    },
    {
      body: "ChatRequest",
      detail: {
        tags: ["Agent"],
        summary: "SSE 流式获取回复与工具调用过程",
      },
    },
  );
