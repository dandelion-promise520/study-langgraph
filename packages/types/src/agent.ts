import { z } from "zod";

export const ChatMessageSchema = z.object({
  type: z.string().describe("消息类型 (human, ai, tool, system)"),
  content: z.string().describe("消息内容"),
});

export const ChatRequestSchema = z.object({
  message: z.string().min(1, "消息不能为空").describe("用户输入的自然语言消息"),
  threadId: z
    .string()
    .optional()
    .default("default-thread")
    .describe("会话 ID，用于多轮对话状态隔离与记忆"),
});

export const ChatResponseSchema = z.object({
  reply: z.string().describe("AI 最终回复内容"),
  llmCalls: z.number().describe("大模型调用次数"),
  threadId: z.string().describe("会话 ID"),
  messages: z.array(ChatMessageSchema).describe("完整的消息上下文列表"),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatRequestDto = z.infer<typeof ChatRequestSchema>;
export type ChatResponseDto = z.infer<typeof ChatResponseSchema>;
