import type { ApiErrorDto } from "@lg-lab/types";

import { env } from "@backend/config/env";
import { agentModule, healthModule, threadModule } from "@backend/modules";
import { checkpointer } from "@backend/modules/agent/agent.graph";
import openapi from "@elysia/openapi";
import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import { zodToJsonSchema } from "zod-to-json-schema";

import { AppError } from "./lib/errors";

const app = new Elysia()
  .onStart(async () => {
    try {
      await checkpointer.setup();
      console.log("LangGraph Postgres 检查点表已就绪");
    } catch (error) {
      console.error("LangGraph Postgres 检查点表初始化失败:", error);
    }
  })
  // 请求进入日志
  .onRequest(({ request }) => {
    console.log(`--> ${request.method} ${new URL(request.url).pathname}`);
  })
  // 响应完成日志
  .onAfterResponse(({ request, set }) => {
    console.log(`<-- ${request.method} ${new URL(request.url).pathname} ${set.status ?? 200}`);
  })
  // 全局异常处理
  .onError(({ code, error }): ApiErrorDto => {
    if (error instanceof AppError) {
      return { code: error.code, message: error.message };
    }

    if (code === "VALIDATION") {
      const issues = error.all;
      return {
        code: "VALIDATION_FAILED",
        message: issues[0]?.message ?? "参数校验失败",
        details: issues.map((issue) => ({
          field: issue.path,
          message: issue.message,
        })),
      };
    }

    if (code === "NOT_FOUND") return { code: "NOT_FOUND", message: "接口不存在" };

    if (code === "PARSE") return { code: "INVALID_BODY", message: "请求体不是合法的 JSON" };

    console.error("[未捕获异常]", error);

    return { code: "INTERNAL_ERROR", message: "服务器内部错误" };
  })
  .use(cors())
  .use(
    rateLimit({
      duration: 60 * 1000, // 限流时间窗口：1 分钟（60000 ms）
      max: 100, // 单个 IP 每分钟最多允许 100 次请求
      scoping: "global", // 作用域：全局所有路由生效
      headers: true, // 自动在响应头返回 RateLimit-* 相关信息
      skip: (request) => {
        const url = new URL(request.url);
        return (
          url.pathname === "/" || url.pathname === "/health" || url.pathname.startsWith("/openapi")
        );
      }, //白名单放行：跳过根路径健 康探针与 OpenAPI 文档页面，防止文档刷新被限流
    }),
  )
  .use(
    openapi({
      mapJsonSchema: {
        zod: zodToJsonSchema,
      },
    }),
  )
  .use(healthModule)
  .use(agentModule)
  .use(threadModule)
  .get("/", () => ({
    status: "ok",
    service: "LangGraph Elysia Backend",
  }))
  .listen(env.PORT);

console.log(`🦊 Elysia 已启动: http://localhost:${env.PORT}`);
console.log(`openapi已启动: http://localhost:${env.PORT}/openapi`);

export type App = typeof app;
