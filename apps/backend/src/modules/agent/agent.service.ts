import type { ChatRequestDto, ChatResponseDto } from "@lg-lab/types";

import { HumanMessage } from "@langchain/core/messages";

import { simpleAgent } from "./agent.graph";

export class AgentService {
  // 普通调用（非流式）
  async chat(body: ChatRequestDto): Promise<ChatResponseDto> {
    // 1. 调用 LangGraph
    const result = await simpleAgent.invoke(
      {
        messages: [new HumanMessage(body.message)],
      },
      { configurable: { thread_id: body.threadId ?? "default" } },
    );

    // 2. 提取大模型回复的文本内容
    const lastMessage = result.messages.at(-1);
    const reply =
      typeof lastMessage?.content === "string"
        ? lastMessage.content
        : JSON.stringify(lastMessage?.content ?? "");

    return { reply };
  }

  // 流式输出（异步生成器）
  async *chatStream(body: ChatRequestDto) {
    const stream = await simpleAgent.stream(
      { messages: [new HumanMessage(body.message)] },
      { streamMode: "messages", configurable: { thread_id: body.threadId ?? "default" } },
    );

    for await (const [chunk] of stream) {
      if (typeof chunk.content === "string" && chunk.content) {
        yield chunk.content;
      }
    }
  }
}

export const agentService = new AgentService();
