import type { ChatRequestDto, ChatResponseDto } from "@lg-lab/types";

import { HumanMessage } from "@langchain/core/messages";

import { threadService } from "../thread/thread.service";
import { simpleAgent } from "./agent.graph";

export class AgentService {
  // 内部校验工具，确保会话合法存在
  private async validateThread(threadId?: string): Promise<string> {
    if (!threadId) {
      throw new Error("请求参数缺少 threadId");
    }

    const thread = await threadService.getThreadById(threadId);
    if (!thread) {
      throw new Error(`会话不存在:${threadId}`);
    }

    return threadId;
  }

  // 普通调用
  async chat(body: ChatRequestDto): Promise<ChatResponseDto> {
    // 拿到合法threadId
    const threadId = await this.validateThread(body.threadId);

    // 保存用户信息
    await threadService.saveMessage(threadId, "user", body.message);

    // 调用 LangGraph
    const result = await simpleAgent.invoke(
      {
        messages: [new HumanMessage(body.message)],
      },
      { configurable: { thread_id: threadId } },
    );

    // 提取大模型回复的文本内容
    const lastMessage = result.messages.at(-1);
    const reply =
      typeof lastMessage?.content === "string"
        ? lastMessage.content
        : JSON.stringify(lastMessage?.content ?? "");

    // 保存ai回复消息
    await threadService.saveMessage(threadId, "assistant", reply);

    return { reply };
  }

  // 流式输出（异步生成器）
  async *chatStream(body: ChatRequestDto) {
    // 拿到合法threadId
    const threadId = await this.validateThread(body.threadId);

    // 保存用户信息
    await threadService.saveMessage(threadId, "user", body.message);

    const stream = await simpleAgent.stream(
      { messages: [new HumanMessage(body.message)] },
      { streamMode: "messages", configurable: { thread_id: body.threadId ?? "default" } },
    );

    // 存个整体回复进数据库
    let fullReply = "";

    for await (const [chunk] of stream) {
      if (typeof chunk.content === "string" && chunk.content) {
        fullReply += chunk.content;
        yield chunk.content;
      }
    }
    if (fullReply) {
      // 保存ai回复消息
      await threadService.saveMessage(threadId, "assistant", fullReply);
    }
  }
}

export const agentService = new AgentService();
