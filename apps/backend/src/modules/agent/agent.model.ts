import {
  ChatRequestSchema,
  ChatResponseSchema,
  ChatStreamChunkSchema,
  type ChatRequestDto,
  type ChatResponseDto,
  type ChatStreamChunkDto,
} from "@lg-lab/types";

export const AgentModels = {
  ChatRequest: ChatRequestSchema,
  ChatResponse: ChatResponseSchema,
  ChatStreamChunk: ChatStreamChunkSchema,
};

// 导出强类型以保持对齐和兼容
export type ChatRequest = ChatRequestDto;
export type ChatResponse = ChatResponseDto;
export type ChatStreamChunk = ChatStreamChunkDto;
