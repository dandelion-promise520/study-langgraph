import { HumanMessage } from "@langchain/core/messages";

import { mathAgent } from "./agent.graph";

export class AgentService {
  /**
   * 同步调用 Agent 并返回完整结果
   */
  async chat(message: string, threadId: string = "default-thread") {
    const config = { configurable: { thread_id: threadId } };
    const result = await mathAgent.invoke(
      {
        messages: [new HumanMessage(message)],
      },
      config,
    );

    const lastMessage = result.messages.at(-1);
    const reply =
      typeof lastMessage?.content === "string"
        ? lastMessage.content
        : JSON.stringify(lastMessage?.content ?? "");

    const messages = result.messages.map((m: any) => ({
      type: typeof m.getType === "function" ? m.getType() : (m._getType?.() ?? m.type ?? "unknown"),
      content: typeof m.content === "string" ? m.content : JSON.stringify(m.content ?? ""),
    }));

    return {
      reply,
      llmCalls: result.llmCalls,
      threadId,
      messages,
    };
  }

  /**
   * SSE 流式返回执行事件与大模型输出 Token
   */
  async *chatStream(message: string, threadId: string = "default-thread") {
    const config = { configurable: { thread_id: threadId } };
    const stream = mathAgent.streamEvents(
      {
        messages: [new HumanMessage(message)],
      },
      { ...config, version: "v2" },
    );

    for await (const event of stream) {
      // 1. 大模型生成的 token 片段
      if (event.event === "on_chat_model_stream") {
        const chunkContent = event.data?.chunk?.content;
        if (chunkContent) {
          yield `data: ${JSON.stringify({
            event: "token",
            data: typeof chunkContent === "string" ? chunkContent : JSON.stringify(chunkContent),
          })}\n\n`;
        }
      }

      // 2. 工具调用开始
      if (event.event === "on_tool_start") {
        yield `data: ${JSON.stringify({
          event: "tool_start",
          data: {
            name: event.name,
            input: event.data?.input,
          },
        })}\n\n`;
      }

      // 3. 工具调用结束
      if (event.event === "on_tool_end") {
        yield `data: ${JSON.stringify({
          event: "tool_end",
          data: {
            name: event.name,
            output: event.data?.output,
          },
        })}\n\n`;
      }
    }

    yield `data: ${JSON.stringify({ event: "done", data: "[DONE]" })}\n\n`;
  }
}

export const agentService = new AgentService();
