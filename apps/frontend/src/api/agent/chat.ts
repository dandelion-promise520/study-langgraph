import type { ChatRequestDto, ChatResponseDto } from "@lg-lab/types";

import { instance } from "../instance";

export const sendChatMessage = (data: ChatRequestDto, signal?: AbortSignal) => {
  return instance.post<ChatResponseDto>("/agent/chat", data, { signal });
};
