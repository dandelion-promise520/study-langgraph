import type { CreateThreadDto, MessageDto, ThreadDto, UpdateThreadDto } from "@lg-lab/types";

import { threadService } from "./thread.service";

export class ThreadController {
  // 获取会话
  async getThreads({ userId }: { userId: string }): Promise<ThreadDto[]> {
    return await threadService.getThreads({ userId });
  }

  // 创建会话
  async createThread({
    data,
    userId,
  }: {
    data: CreateThreadDto;
    userId: string;
  }): Promise<ThreadDto> {
    return await threadService.createThread({ data, userId });
  }

  // 更新会话
  async updateThreads({
    id,
    data,
    userId,
  }: {
    id: string;
    data: UpdateThreadDto;
    userId: string;
  }): Promise<{ success: boolean }> {
    await threadService.updateThread({ data, id, userId });
    return { success: true };
  }

  // 删除会话
  async deleteThreads({
    id,
    userId,
  }: {
    id: string;
    userId: string;
  }): Promise<{ success: boolean }> {
    await threadService.deleteThread({ id, userId });
    return { success: true };
  }

  // 获取会话信息
  async getMessages({
    threadId,
    userId,
  }: {
    threadId: string;
    userId: string;
  }): Promise<MessageDto[]> {
    return await threadService.getMessages({ threadId, userId });
  }
}

export const threadController = new ThreadController();
