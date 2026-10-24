import type { App } from "@lg-lab/backend";

import { EdenFetchError, treaty } from "@elysiajs/eden";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export const client = treaty<App>(API_BASE_URL, {
  // 这样在api层只需要管成功的部分，失败的部分在这边可以处理好
  throwHttpError: true,
  fetch: { credentials: "include" },
});

interface ErrorPayload {
  message?: string;
}

// 网络部分错误函数
export const getErrorMessage = (error: unknown, fallback = "网络异常"): string => {
  if (error instanceof EdenFetchError) {
    if (typeof error.value === "string") return error.value;

    const val = error.value as ErrorPayload;
    if (typeof val?.message === "string") {
      return val.message;
    }
  }

  return error instanceof Error ? error.message : fallback;
};
