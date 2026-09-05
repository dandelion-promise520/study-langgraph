import axios from "axios";

export const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  timeout: 5000,
  headers: { "X-Custom-Header": "foobar" },
});
