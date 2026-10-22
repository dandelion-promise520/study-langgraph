import Elysia from "elysia";

import { requireUser } from "../auth/require-user";
import { threadController } from "./thread.controller";
import { ThreadModels } from "./thread.model";

export const threadModule = new Elysia({ prefix: "/threads" })
  .use(requireUser)
  .model(ThreadModels)
  // 获取会话
  .get("/", ({ userId }) => threadController.getThreads({ userId }))
  // 新建会话
  .post("/", ({ body, userId }) => threadController.createThread({ data: body, userId }), {
    body: "CreateThread",
  })
  //重命名会话
  .patch(
    "/:id",
    ({ params, body, userId }) =>
      threadController.updateThread({ id: params.id, data: body, userId }),
    {
      params: "ThreadParams",
      body: "UpdateThread",
    },
  )
  // 删除会话
  .delete(
    "/:id",
    async ({ params, userId, set }) => {
      await threadController.deleteThread({ id: params.id, userId });
      set.status = 204;
    },
    { params: "ThreadParams" },
  )
  // 获取会话历史消息
  .get(
    "/:id/messages",
    ({ params, userId }) => threadController.getMessages({ threadId: params.id, userId }),
    { params: "ThreadParams" },
  );
