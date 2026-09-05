import axios, { AxiosError, type AxiosRequestConfig } from "axios";

export const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  timeout: 60000,
  headers: { "X-Custom-Header": "foobar" },
  adapter: "fetch",
});

instance.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<{ message?: string }>) => {
    const msg = error.response?.data.message || error.message || "网络异常";

    return Promise.reject(new Error(msg));
  },
);

export const request = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    instance.get<unknown, T>(url, config),

  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    instance.post<unknown, T>(url, data, config),
};
