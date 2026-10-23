import z from "zod";

import { IsoDateTimeSchema } from "./common";

//  全局唯一的会话 ID 契约基元
export const ThreadIdSchema = z
  .string()
  .uuid("会话 ID 必须是合法的 UUID 格式")
  .describe("全局唯一的会话 ID (UUIDv4)");

export type ThreadId = z.infer<typeof ThreadIdSchema>;

// 会话对象
export const ThreadSchema = z.object({
  id: ThreadIdSchema,
  title: z.string(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

// 新建会话入参
export const CreateThreadSchema = z.object({
  id: ThreadIdSchema.optional(),
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
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
});

// 路径参数
export const ThreadParamsSchema = z.object({
  id: ThreadIdSchema,
});

export type ThreadDto = z.infer<typeof ThreadSchema>;
export type CreateThreadDto = z.infer<typeof CreateThreadSchema>;
export type UpdateThreadDto = z.infer<typeof UpdateThreadSchema>;
export type MessageDto = z.infer<typeof MessageSchema>;
export type ThreadParamsDto = z.infer<typeof ThreadParamsSchema>;
