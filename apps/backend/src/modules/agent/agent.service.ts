import type { ChatRequestDto, ChatResponseDto } from "@lg-lab/types";

import { threadService } from "@backend/modules/thread/thread.service";
import { HumanMessage } from "@langchain/core/messages";

import { simpleAgent } from "./agent.graph";

export class AgentService {
  // 内部校验工具，确保会话合法存在
  private async ensureThread({
    threadId,
    message,
    userId,
  }: {
    threadId: string;
    message: string;
    userId: string;
  }): Promise<string> {
    const thread = await threadService.getThreadById({ id: threadId, userId });

    if (!thread) {
      const title = message.length > 20 ? `${message.slice(0, 20)}...` : message;
      await threadService.createThread({ data: { id: threadId, title }, userId });
    }

    return threadId;
  }

  // 普通调用
  async chat({ body, userId }: { body: ChatRequestDto; userId: string }): Promise<ChatResponseDto> {
    // 拿到合法threadId
    const threadId = await this.ensureThread({
      threadId: body.threadId,
      message: body.message,
      userId,
    });

    // 保存用户信息
    await threadService.saveMessage({ content: body.message, role: "user", threadId });

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
    await threadService.saveMessage({ content: reply, role: "assistant", threadId });

    return { reply };
  }

  // 流式输出（异步生成器）
  async *chatStream({ body, userId }: { body: ChatRequestDto; userId: string }) {
    // 拿到合法threadId
    const threadId = await this.ensureThread({
      threadId: body.threadId,
      message: body.message,
      userId,
    });

    // 保存用户信息
    await threadService.saveMessage({ content: body.message, role: "user", threadId });

    const stream = await simpleAgent.stream(
      { messages: [new HumanMessage(body.message)] },
      { streamMode: "messages", configurable: { thread_id: threadId } },
    );

    // 存个整体回复进数据库
    let fullReply = "";

    try {
      for await (const [chunk] of stream) {
        if (typeof chunk.content === "string" && chunk.content) {
          fullReply += chunk.content;
          yield chunk.content;
        }
      }
    } finally {
      if (fullReply) {
        // 保存ai回复消息
        await threadService.saveMessage({ content: fullReply, role: "assistant", threadId });
      }
    }
  }
}

export const agentService = new AgentService();
