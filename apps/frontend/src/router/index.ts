import type { QueryClient } from "@tanstack/react-query";

import { createRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

export interface MyRouterContext {
  queryClient: QueryClient;
}

export const router = createRouter({
  routeTree,
  context: {
    // 初始占位，在 main.tsx 中通过 Provider 传入真实实例
    queryClient: undefined!,
  },
});

// 集中声明全局类型
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
