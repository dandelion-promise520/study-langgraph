import { router } from "@frontend/router";
import "@frontend/styles/index.css";
import { ThemeProvider } from "@frontend/vendor/ui/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 分钟内数据被视为新鲜
      refetchOnWindowFocus: false, // 窗口获得焦点时不自动重拉
      retry: 1, // 失败重试 1 次
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <RouterProvider router={router} context={{ queryClient }}></RouterProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
