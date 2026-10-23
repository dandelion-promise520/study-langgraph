import Elysia from "elysia";

import { requireAuth } from "../auth/require-auth";
import { threadController } from "./thread.controller";
import { ThreadModels } from "./thread.model";

export const threadModule = new Elysia({ prefix: "/threads" })
  .use(requireAuth)
  .model(ThreadModels)
  // 获取会话
  .get("/", ({ userId }) => threadController.getThreads({ userId }), {
    response: { 200: "ThreadList" },
    detail: { security: [{ cookieAuth: [] }] },
  })
  // 新建会话
  .post(
    "/",
    ({ body, userId, set }) => {
      set.status = 201;
      return threadController.createThread({ data: body, userId });
    },
    {
      body: "CreateThread",
      response: { 201: "Thread" },
      detail: { security: [{ cookieAuth: [] }] },
    },
  )
  //重命名会话
  .patch(
    "/:id",
    ({ params, body, userId }) =>
      threadController.updateThread({ id: params.id, data: body, userId }),
    {
      params: "ThreadParams",
      body: "UpdateThread",
      response: { 200: "Thread" },
      detail: { security: [{ cookieAuth: [] }] },
    },
  )
  // 删除会话
  .delete(
    "/:id",
    async ({ params, userId, set }) => {
      await threadController.deleteThread({ id: params.id, userId });
      set.status = 204;
    },
    { params: "ThreadParams", detail: { security: [{ cookieAuth: [] }] } },
  )
  // 获取会话历史消息
  .get(
    "/:id/messages",
    ({ params, userId }) => threadController.getMessages({ threadId: params.id, userId }),
    {
      params: "ThreadParams",
      detail: { security: [{ cookieAuth: [] }] },
      response: { 200: "MessageList" },
    },
  );
