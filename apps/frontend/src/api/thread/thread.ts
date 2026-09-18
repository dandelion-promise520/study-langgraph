import type { CreateThreadDto, MessageDto, ThreadDto, UpdateThreadDto } from "@lg-lab/types";

import { client } from "../eden";

// 获取所有会话列表
export const getThreads = async (): Promise<ThreadDto[]> => {
  const { data } = await client.threads.get();
  return data ?? [];
};

// 创建新会话
export const createThread = async (body?: CreateThreadDto): Promise<ThreadDto> => {
  const { data } = await client.threads.post(body ?? {});
  if (!data) throw new Error("创建会话失败");
  return data;
};

// 重命名会话
export const updateThread = async (id: string, body: UpdateThreadDto) => {
  const { data } = await client.threads({ id }).patch(body);
  return data ?? { success: true };
};

// 删除会话
export const deleteThread = async (id: string) => {
  const { data } = await client.threads({ id }).delete();
  return data ?? { success: true };
};

// 获取会话历史消息
export const getThreadMessages = async (id: string): Promise<MessageDto[]> => {
  const { data } = await client.threads({ id }).messages.get();
  return data ?? [];
};
