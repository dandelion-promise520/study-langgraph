import { z } from "zod";

export const ChatRequestSchema = z.object({
  message: z.string().min(1, "消息内容不能为空"),
  threadId: z.string().optional(),
});

export const ChatResponseSchema = z.object({
  reply: z.string(),
});

export type ChatRequestDto = z.infer<typeof ChatRequestSchema>;
export type ChatResponseDto = z.infer<typeof ChatResponseSchema>;
