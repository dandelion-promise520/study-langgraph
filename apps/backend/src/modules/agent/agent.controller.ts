import type { ChatRequestDto, ChatResponseDto } from "@lg-lab/types";

import { sse } from "elysia";

import { agentService } from "./agent.service";

export class AgentController {
  /**
   * 处理聊天请求
   */
  async chat(body: ChatRequestDto): Promise<ChatResponseDto> {
    return await agentService.chat(body);
  }

  async *chatStream(body: ChatRequestDto) {
    try {
      // 1. 调用 Service 获取纯文本/Token 异步生成器流
      const textStream = agentService.chatStream(body);

      // 2. 将每个文本增量包装为 SSE message 事件
      for await (const delta of textStream) {
        yield sse({
          event: "message",
          data: JSON.stringify({ delta }),
        });
      }

      // 3. 模型生成完成，推送 [DONE] 结束标记
      yield sse({
        event: "done",
        data: "[DONE]",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "网络错误";

      yield sse({
        event: "error",
        data: JSON.stringify({ error: errorMessage }),
      });
    }
  }
}

export const agentController = new AgentController();
