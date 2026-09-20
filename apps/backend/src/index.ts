import openapi from "@elysia/openapi";
import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import { zodToJsonSchema } from "zod-to-json-schema";

import { env } from "./config/env";
import { agentModule } from "./modules/agent";
import { healthModule } from "./modules/health";
import { threadModule } from "./modules/thread";

const app = new Elysia()
  // 请求进入日志
  .onRequest(({ request }) => {
    console.log(`--> ${request.method} ${new URL(request.url).pathname}`);
  })
  // 响应完成日志
  .onAfterResponse(({ request, set }) => {
    console.log(`<-- ${request.method} ${new URL(request.url).pathname} ${set.status ?? 200}`);
  })
  // 全局未捕获异常日志
  .onError(({ code, error, request }) => {
    console.error(`[Error] ${request.method} ${request.url} [${code}]:`, error);
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
