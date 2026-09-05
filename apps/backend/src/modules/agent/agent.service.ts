import type { ChatRequestDto, ChatResponseDto } from "@lg-lab/types";

import { HumanMessage } from "@langchain/core/messages";

import { simpleAgent } from "./agent.graph";

export class AgentService {
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
}

export const agentService = new AgentService();
