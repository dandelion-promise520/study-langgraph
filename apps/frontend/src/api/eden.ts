import type { App } from "@lg-lab/backend";

import { EdenFetchError, treaty } from "@elysiajs/eden";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export const client = treaty<App>(API_BASE_URL, { throwHttpError: true });

export const getErrorMessage = (error: unknown, fallback = "网络异常"): string => {
  if (error instanceof EdenFetchError) {
    if (typeof error.value === "string") return error.value;
    if (error.value && typeof error.value === "object" && "message" in error.value) {
      return String(error.value.message);
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};
