import {
  CHAT_STREAM_DONE_TAG,
  type ChatRequestDto,
  type ChatResponseDto,
  type ChatStreamChunkDto,
} from "@lg-lab/types";
import { sse } from "elysia";

import { agentService } from "./agent.service";

export class AgentController {
  /**
   * 处理聊天请求
   */
  async chat({ body, userId }: { body: ChatRequestDto; userId: string }): Promise<ChatResponseDto> {
    return await agentService.chat({ body, userId });
  }

  async *chatStream({ body, userId }: { body: ChatRequestDto; userId: string }) {
    try {
      // 1. 调用 Service 获取纯文本/Token 异步生成器流
      const textStream = agentService.chatStream({ body, userId });

      // 2. 将每个文本增量包装为 SSE message 事件
      for await (const delta of textStream) {
        const payload: ChatStreamChunkDto = { delta };

        yield sse({
          event: "message",
          data: payload,
        });
      }

      // 3. 模型生成完成，推送 [DONE] 结束标记
      yield sse({
        event: "done",
        data: CHAT_STREAM_DONE_TAG,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "网络错误";

      const errorPayload: ChatStreamChunkDto = { error: errorMessage };

      yield sse({
        event: "error",
        data: errorPayload,
      });
    }
  }
}

export const agentController = new AgentController();
