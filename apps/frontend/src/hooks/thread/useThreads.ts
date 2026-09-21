import type { CreateThreadDto, UpdateThreadDto } from "@lg-lab/types";

import {
  createThread,
  deleteThread,
  getThreadMessages,
  getThreads,
  updateThread,
} from "@frontend/api";
import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const THREAD_QUERY_KEYS = {
  all: ["threads"] as const,
  messages: (threadId: string) => ["threads", threadId, "messages"] as const,
};

export const useThreads = () => {
  const queryClient = useQueryClient();

  // 获取所有会话列表
  const threadsQuery = useQuery({
    queryKey: THREAD_QUERY_KEYS.all,
    queryFn: getThreads,
  });

  // 新建会话
  const createMutation = useMutation({
    mutationFn: (body?: CreateThreadDto) => createThread(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: THREAD_QUERY_KEYS.all });
    },
  });

  // 重命名会话
  const renameMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateThreadDto }) => updateThread(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: THREAD_QUERY_KEYS.all });
    },
  });

  // 删除会话
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteThread(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: THREAD_QUERY_KEYS.all });
    },
  });

  return {
    threads: threadsQuery.data ?? [],
    isLoading: threadsQuery.isLoading,
    isError: threadsQuery.isError,
    createThread: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    renameThread: renameMutation.mutateAsync,
    deleteThread: deleteMutation.mutateAsync,
  };
};

// 获取指定会话历史信息
export const useThreadMessages = (threadId: string | null) => {
  return useQuery({
    queryKey: THREAD_QUERY_KEYS.messages(threadId ?? ""),
    queryFn: threadId ? () => getThreadMessages(threadId) : skipToken,
  });
};
