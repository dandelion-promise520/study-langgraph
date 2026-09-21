import z from "zod";

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

// 消息角色枚举
export const MessageRoleSchema = z.enum(["user", "assistant"]);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

// 历史消息对象
export const MessageSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  role: MessageRoleSchema,
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// 路径参数
export const ThreadParamsSchema = z.object({
  id: z.string().min(1, "会话ID不能为空"),
});

export type ThreadDto = z.infer<typeof ThreadSchema>;
export type CreateThreadDto = z.infer<typeof CreateThreadSchema>;
export type UpdateThreadDto = z.infer<typeof UpdateThreadSchema>;
export type MessageDto = z.infer<typeof MessageSchema>;
export type ThreadParamsDto = z.infer<typeof ThreadParamsSchema>;
