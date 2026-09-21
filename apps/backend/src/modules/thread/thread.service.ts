import type {
  CreateThreadDto,
  MessageDto,
  MessageRole,
  ThreadDto,
  UpdateThreadDto,
} from "@lg-lab/types";

import { db } from "../../prisma/db";

export class ThreadService {
  // 获取所有会话
  async getThreads(): Promise<ThreadDto[]> {
    return await db.orm.public.Thread.select("id", "title", "createdAt", "updatedAt")
      .orderBy((t) => t.updatedAt.desc())
      .all();
  }

  // 按id查一个会话
  async getThreadById(id: string): Promise<ThreadDto | null> {
    return await db.orm.public.Thread.first({ id });
  }

  // 新建会话
  async createThread(data: CreateThreadDto): Promise<ThreadDto> {
    // 检查是否已存在空对话
    const existingEmptyThread = await db.orm.public.Thread.where((t) => t.messages.none()).first();

    if (existingEmptyThread) {
      return existingEmptyThread;
    }

    const id = data.id ?? `thread-${Date.now()}`;
    return db.orm.public.Thread.create({
      id,
      title: data.title ?? "新会话",
    });
  }

  // 重命名会话
  async updateThread(id: string, data: UpdateThreadDto) {
    await db.orm.public.Thread.where({ id }).update({ title: data.title });
  }

  // 删除会话
  async deleteThread(id: string) {
    await db.orm.public.Message.where({ threadId: id }).delete();
    await db.orm.public.Thread.where({ id }).delete();
  }

  // 查询指定会话历史消息
  async getMessages(threadId: string): Promise<MessageDto[]> {
    return await db.orm.public.Message.select(
      "id",
      "threadId",
      "role",
      "content",
      "createdAt",
      "updatedAt",
    )
      .where({ threadId })
      .orderBy((m) => m.createdAt.asc())
      .all();
  }

  // 保存单条消息
  async saveMessage(threadId: string, role: MessageRole, content: string) {
    await db.orm.public.Message.create({
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      threadId,
      role,
      content,
    });

    await db.orm.public.Thread.where({ id: threadId }).update({});
  }
}

export const threadService = new ThreadService();
