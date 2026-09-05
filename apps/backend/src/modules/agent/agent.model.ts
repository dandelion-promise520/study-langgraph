import { z } from "zod";

export const AgentModels = {
  ChatRequest: z.object({
    message: z.string().min(1, "消息内容不能为空"),
  }),
  ChatResponse: z.object({
    reply: z.string(),
  }),
};

// 使用 z.infer 自动导出强类型
export type ChatRequest = z.infer<typeof AgentModels.ChatRequest>;
export type ChatResponse = z.infer<typeof AgentModels.ChatResponse>;
