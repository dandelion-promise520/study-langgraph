import { z } from "zod";

export const ChatRequestSchema = z.object({
  message: z.string().min(1, "消息内容不能为空"),
  threadId: z.string().optional(),
});

export const ChatResponseSchema = z.object({
  reply: z.string(),
});

export const CHAT_STREAM_DONE_TAG = "[DONE]" as const;

export const ChatStreamChunkSchema = z.object({
  delta: z.string().optional(),
  error: z.string().optional(),
});

export type ChatRequestDto = z.infer<typeof ChatRequestSchema>;
export type ChatResponseDto = z.infer<typeof ChatResponseSchema>;
export type ChatStreamChunkDto = z.infer<typeof ChatStreamChunkSchema>;
