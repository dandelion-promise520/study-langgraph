import type { ChatRequestDto, ChatResponseDto } from "@lg-lab/types";

import { request } from "../instance";

export const sendChatMessage = (data: ChatRequestDto, signal?: AbortSignal) => {
  return request.post<ChatResponseDto>("/agent/chat", data, { signal });
};
