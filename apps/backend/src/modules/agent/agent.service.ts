import type { ChatRequestDto, ChatResponseDto } from "@lg-lab/types";

import { AIMessageChunk, HumanMessage } from "@langchain/core/messages";

import { simpleAgent } from "./agent.graph";

export class AgentService {
  // 普通调用（非流式）
  async chat(body: ChatRequestDto): Promise<ChatResponseDto> {
    // 1. 调用 LangGraph
    const result = await simpleAgent.invoke({
      messages: [new HumanMessage(body.message)],
    });

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
    const eventStream = await simpleAgent.streamEvents(
      { messages: [new HumanMessage(body.message)] },
      { version: "v3" },
    );

    for await (const event of eventStream) {
      if (event.method === "messages") {
        const chunk = event.params.data as AIMessageChunk;
        if (typeof chunk?.content === "string" && chunk.content) {
          yield chunk.content;
        }
      }
    }
  }
}

export const agentService = new AgentService();
