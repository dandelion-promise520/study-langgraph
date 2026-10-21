import type {
  CreateThreadDto,
  MessageDto,
  MessageRole,
  ThreadDto,
  UpdateThreadDto,
} from "@lg-lab/types";

import { db } from "@backend/db";
import { messages, threads } from "@backend/db/schema";
import { AppError } from "@backend/lib/errors";
import { and, asc, desc, eq, sql } from "drizzle-orm";

export class ThreadService {
  // 获取所有会话
  async getThreads({ userId }: { userId: string }): Promise<ThreadDto[]> {
    return await db
      .select()
      .from(threads)
      .where(eq(threads.userId, userId))
      .orderBy(desc(threads.updatedAt));
  }

  // 按id查一个会话
  async getThreadById({ id, userId }: { id: string; userId: string }): Promise<ThreadDto | null> {
    // 相当于const result = results[0]，取数组的第一个值，也等于const result = results.at(0)
    const [result] = await db
      .select()
      .from(threads)
      .where(and(eq(threads.id, id), eq(threads.userId, userId)))
      .limit(1);

    return result ?? null;
  }

  // 新建会话
  async createThread({
    data,
    userId,
  }: {
    data: CreateThreadDto;
    userId: string;
  }): Promise<ThreadDto> {
    const [created] = await db
      .insert(threads)
      .values({ id: data.id, title: data.title ?? "新会话", userId }) //如果前端传了 UUID 就用前端的；如果 data.id 是 undefined，Drizzle 会自动触发 $defaultFn 调用 Bun.randomUUIDv7()
      .onConflictDoNothing()
      .returning();

    if (created) return created;

    if (data.id) {
      const existing = await this.getThreadById({ id: data.id, userId });
      if (existing) return existing;
    }

    throw new AppError({ code: "THREAD_ID_TAKEN" });
  }

  // 重命名会话
  async updateThread({ data, id, userId }: { id: string; data: UpdateThreadDto; userId: string }) {
    const [updated] = await db
      .update(threads)
      .set({ title: data.title })
      .where(and(eq(threads.id, id), eq(threads.userId, userId)))
      .returning();

    if (!updated) throw new AppError({ code: "THREAD_NOT_FOUND" });
  }

  // 删除会话
  async deleteThread({ id, userId }: { id: string; userId: string }) {
    const [deleted] = await db
      .delete(threads)
      .where(and(eq(threads.id, id), eq(threads.userId, userId)))
      .returning();

    if (!deleted) throw new AppError({ code: "THREAD_NOT_FOUND" });
  }

  // 查询指定会话历史消息,先验归属，再取消息
  async getMessages({
    threadId,
    userId,
  }: {
    threadId: string;
    userId: string;
  }): Promise<MessageDto[]> {
    const thread = await this.getThreadById({ id: threadId, userId });

    if (!thread) throw new AppError({ code: "THREAD_NOT_FOUND" });

    return await db
      .select()
      .from(messages)
      .where(eq(messages.threadId, threadId))
      .orderBy(asc(messages.createdAt));
  }

  // 保存单条消息
  async saveMessage({
    content,
    role,
    threadId,
  }: {
    threadId: string;
    role: MessageRole;
    content: string;
  }) {
    await db.transaction(async (tx) => {
      // 把消息插入到消息表中
      await tx.insert(messages).values({
        threadId,
        role,
        content,
      });

      // 更新对应会话的更新时间
      await tx
        .update(threads)
        .set({ updatedAt: sql`now()` })
        .where(eq(threads.id, threadId));
    });
  }
}

export const threadService = new ThreadService();
