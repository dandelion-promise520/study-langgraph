import type { UserDto } from "@lg-lab/types";

import { EdenFetchError } from "@elysiajs/eden";
import { getMe, login, logout, register } from "@frontend/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const AUTH_QUERY_KEYS = {
  me: ["auth", "me"] as const,
};

// 网络错误时才重试，如果是未授权则不重试
const shouldRetry = (failureCount: number, error: Error) => {
  if (error instanceof EdenFetchError && error.status >= 400 && error.status < 500) {
    return false;
  }

  return failureCount < 2;
};

export const useMe = () =>
  useQuery({
    queryKey: AUTH_QUERY_KEYS.me,
    queryFn: getMe,
    retry: shouldRetry,
  });

export const useAuth = () => {
  const { data, isPending } = useMe();

  return { data: data ?? null, isAuthenticated: Boolean(data), idLoading: isPending };
};

// 注册
export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: register,
    onSuccess: (user) => {
      // 注册与登录之后自动写缓存，register与login接口都返回用户信息，获取用户信息接口可以少调一次，获取用户信息接口在缓存里没有 user调用，如刷新,直接输入 URL,缓存超过 staleTime
      queryClient.setQueryData<UserDto>(AUTH_QUERY_KEYS.me, user);
    },
  });
};

// 登录
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      queryClient.setQueryData<UserDto>(AUTH_QUERY_KEYS.me, user);
    },
  });
};

// 退出登录
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // 退出登录之后删除缓存条目
      queryClient.removeQueries({ queryKey: AUTH_QUERY_KEYS.me });
    },
  });
};
