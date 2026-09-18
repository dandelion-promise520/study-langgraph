import Elysia from "elysia";

import { threadController } from "./thread.controller";
import { ThreadModels } from "./thread.model";

export const threadModule = new Elysia({ prefix: "/threads" })
  .model(ThreadModels)
  // 获取会话
  .get("/", async () => {
    return await threadController.getThreads();
  })
  // 新建会话
  .post(
    "/",
    async ({ body }) => {
      return await threadController.createThread(body);
    },
    { body: "CreateThread" },
  )
  //重命名会话
  .patch(
    "/:id",
    async ({ params, body }) => {
      return await threadController.updateThreads(params.id, body);
    },
    {
      params: "ThreadParams",
      body: "UpdateThread",
    },
  )
  // 删除会话
  .delete(
    "/:id",
    async ({ params }) => {
      return await threadController.deleteThreads(params.id);
    },
    { params: "ThreadParams" },
  )
  // 获取会话历史消息
  .get(
    "/:id/messages",
    async ({ params }) => {
      return threadController.getMessages(params.id);
    },
    { params: "ThreadParams" },
  );
