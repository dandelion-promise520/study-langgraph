import type { CreateThreadDto, MessageDto, ThreadDto, UpdateThreadDto } from "@lg-lab/types";

import { threadService } from "./thread.service";

export class ThreadController {
  // 获取会话
  async getThreads(): Promise<ThreadDto[]> {
    return await threadService.getThreads();
  }

  // 创建会话
  async createThread(body: CreateThreadDto): Promise<ThreadDto> {
    return await threadService.createThread(body);
  }

  // 更新会话
  async updateThreads(id: string, body: UpdateThreadDto): Promise<{ success: boolean }> {
    await threadService.updateThread(id, body);
    return { success: true };
  }

  // 删除会话
  async deleteThreads(id: string): Promise<{ success: boolean }> {
    await threadService.deleteThread(id);
    return { success: true };
  }

  // 获取会话信息
  async getMessages(threadId: string): Promise<MessageDto[]> {
    return await threadService.getMessages(threadId);
  }
}

export const threadController = new ThreadController();
