import type { CreateThreadDto, UpdateThreadDto } from "@lg-lab/types";

import { threadService } from "./thread.service";

class ThreadController {
  // 获取会话
  getThreads({ userId }: { userId: string }) {
    return threadService.getThreads({ userId });
  }

  // 创建会话
  createThread({ data, userId }: { data: CreateThreadDto; userId: string }) {
    return threadService.createThread({ data, userId });
  }

  // 更新会话
  updateThread({ id, data, userId }: { id: string; data: UpdateThreadDto; userId: string }) {
    return threadService.updateThread({ data, id, userId });
  }

  // 删除会话
  deleteThread({ id, userId }: { id: string; userId: string }) {
    return threadService.deleteThread({ id, userId });
  }

  // 获取会话信息
  getMessages({ threadId, userId }: { threadId: string; userId: string }) {
    return threadService.getMessages({ threadId, userId });
  }
}

export const threadController = new ThreadController();
