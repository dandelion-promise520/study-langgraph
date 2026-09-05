import {
  ChatRequestSchema,
  ChatResponseSchema,
  type ChatRequestDto,
  type ChatResponseDto,
} from "@lg-lab/types";

export const AgentModels = {
  ChatRequest: ChatRequestSchema,
  ChatResponse: ChatResponseSchema,
};

// 导出强类型以保持对齐和兼容
export type ChatRequest = ChatRequestDto;
export type ChatResponse = ChatResponseDto;
