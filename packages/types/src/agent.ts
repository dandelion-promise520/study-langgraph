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

// 会话对象
export const ThreadSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// 新建会话入参
export const CreateThreadSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
});

// 重命名会话入参
export const UpdateThreadSchema = z.object({
  title: z.string().min(1, "会话标题不能为空"),
});

// 历史消息对象
export const MessageSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  role: z.string(),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ChatRequestDto = z.infer<typeof ChatRequestSchema>;
export type ChatResponseDto = z.infer<typeof ChatResponseSchema>;
export type ChatStreamChunkDto = z.infer<typeof ChatStreamChunkSchema>;

export type ThreadDto = z.infer<typeof ThreadSchema>;
export type CreateThreadDto = z.infer<typeof CreateThreadSchema>;
export type UpdateThreadDto = z.infer<typeof UpdateThreadSchema>;
export type MessageDto = z.infer<typeof MessageSchema>;
