import { defineRelations } from "drizzle-orm";

import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  users: {
    // 一个用户对多个会话，r表示relation
    threads: r.many.threads({
      from: r.users.id,
      to: r.threads.userId,
    }),
  },
  threads: {
    // 一个会话对一个用户
    user: r.one.users({
      from: r.threads.userId,
      to: r.users.id,
    }),
    // 一个会话对多条消息
    messages: r.many.messages({
      from: r.threads.id,
      to: r.messages.threadId,
    }),
  },
  messages: {
    // 一条消息对一个对话
    thread: r.one.threads({
      from: r.messages.threadId,
      to: r.threads.id,
    }),
  },
}));
