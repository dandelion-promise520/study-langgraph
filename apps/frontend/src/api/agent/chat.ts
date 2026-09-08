import type { ChatRequestDto, ChatResponseDto } from "@lg-lab/types";

import { client } from "../eden";

/**
 * 发送单次聊天请求
 */
export const sendChatMessage = async (
  data: ChatRequestDto,
  signal?: AbortSignal,
): Promise<ChatResponseDto> => {
  const { data: res, error } = await client.agent.chat.post(data, {
    fetch: { signal },
  });

  if (error) {
    const message =
      typeof error.value === "object" && error.value && "message" in error.value
        ? String((error.value as { message: unknown }).message)
        : typeof error.value === "string"
          ? error.value
          : "请求失败";
    throw new Error(message);
  }

  return res as ChatResponseDto;
};

/**
 * 发送流式聊天请求，逐块产出 AI 生成的文本
 */
export const sendChatMessageStream = async function* (
  data: ChatRequestDto,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const { data: stream, error } = await client.agent.chat.stream.post(data, {
    fetch: { signal },
  });

  if (error) {
    const message =
      typeof error.value === "object" && error.value && "message" in error.value
        ? String((error.value as { message: unknown }).message)
        : typeof error.value === "string"
          ? error.value
          : "流式请求连接失败";
    throw new Error(message);
  }

  if (!stream) {
    return;
  }

  for await (const chunk of stream) {
    if (!chunk) continue;

    // 1. 流结束事件
    if (chunk.event === "done") {
      return;
    }

    // 2. 异常错误事件
    if (chunk.event === "error") {
      throw new Error(chunk.data.error || "流式服务异常");
    }

    // 3. 正常增量消息事件
    if (chunk.event === "message") {
      if (chunk.data.delta) {
        yield chunk.data.delta;
      }
    }
  }
};
