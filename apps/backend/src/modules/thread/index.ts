import Elysia from "elysia";

import { requireUser } from "../auth/require-user";
import { threadController } from "./thread.controller";
import { ThreadModels } from "./thread.model";

export const threadModule = new Elysia({ prefix: "/threads" })
  .use(requireUser)
  .model(ThreadModels)
  // 获取会话
  .get("/", async ({ userId }) => threadController.getThreads({ userId }))
  // 新建会话
  .post(
    "/",
    async ({ body, userId }) => {
      return await threadController.createThread({ data: body, userId });
    },
    { body: "CreateThread" },
  )
  //重命名会话
  .patch(
    "/:id",
    async ({ params, body, userId }) => {
      return await threadController.updateThreads({ id: params.id, data: body, userId });
    },
    {
      params: "ThreadParams",
      body: "UpdateThread",
    },
  )
  // 删除会话
  .delete(
    "/:id",
    async ({ params, userId }) => {
      return await threadController.deleteThreads({ id: params.id, userId });
    },
    { params: "ThreadParams" },
  )
  // 获取会话历史消息
  .get(
    "/:id/messages",
    async ({ params, userId }) => {
      return threadController.getMessages({ threadId: params.id, userId });
    },
    { params: "ThreadParams" },
  );
