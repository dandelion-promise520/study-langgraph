import type {
  CreateThreadDto,
  MessageDto,
  MessageRole,
  ThreadDto,
  UpdateThreadDto,
} from "@lg-lab/types";

import { db } from "@backend/db";
import { messages, threads } from "@backend/db/schema";
import { asc, desc, eq, sql } from "drizzle-orm";

export class ThreadService {
  // 获取所有会话
  async getThreads(): Promise<ThreadDto[]> {
    return await db.select().from(threads).orderBy(desc(threads.updatedAt));
  }

  // 按id查一个会话
  async getThreadById(id: string): Promise<ThreadDto | null> {
    // 相当于const result = results[0]，取数组的第一个值，也等于const result = results.at(0)
    const [result] = await db.select().from(threads).where(eq(threads.id, id)).limit(1);

    return result ?? null;
  }

  // 新建会话
  async createThread(data: CreateThreadDto): Promise<ThreadDto> {
    const [newThread] = await db
      .insert(threads)
      .values({ id: data.id, title: data.title ?? "新会话" }) //如果前端传了 UUID 就用前端的；如果 data.id 是 undefined，Drizzle 会自动触发 $defaultFn 调用 Bun.randomUUIDv7()
      .returning();

    if (!newThread) throw new Error("创建会话失败");

    return newThread;
  }

  // 重命名会话
  async updateThread(id: string, data: UpdateThreadDto) {
    await db.update(threads).set({ title: data.title }).where(eq(threads.id, id));
  }

  // 删除会话
  async deleteThread(id: string) {
    await db.delete(threads).where(eq(threads.id, id));
  }

  // 查询指定会话历史消息
  async getMessages(threadId: string): Promise<MessageDto[]> {
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
