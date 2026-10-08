import type { MessageDto } from "@lg-lab/types";
import type { QueryClient } from "@tanstack/react-query";

import { getErrorMessage, sendChatMessageStream } from "@frontend/api";
import { THREAD_QUERY_KEYS } from "@frontend/hooks";
import { produce } from "immer";
import { create } from "zustand";

interface ThreadStreamState {
  isGenerating: boolean;
  abortController: AbortController | null;
}

export interface SendMessageParams {
  threadId: string;
  message: string;
  queryClient: QueryClient;
}

interface ChatStore {
  // 维护所有会话的流式状态字典
  streams: Record<string, ThreadStreamState | undefined>;
  // 发送消息
  sendMessage: (params: SendMessageParams) => Promise<void>;
  // 停止消息
  stopMessage: (params: { threadId: string }) => void;
}

export const useChatStore = create<ChatStore>((set, get) => {
  return {
    streams: {},

    sendMessage: async ({ message, queryClient, threadId }) => {
      if (get().streams[threadId]) return;

      const controller = new AbortController();

      set((state) => ({
        streams: {
          ...state.streams,
          [threadId]: { isGenerating: true, abortController: controller },
        },
      }));

      const now = new Date().toISOString();

      const tempUserMsg: MessageDto = {
        id: `temp-user-${Date.now()}`,
        threadId,
        content: message,
        role: "user",
        createdAt: now,
        updatedAt: now,
      };

      const tempAiMsg: MessageDto = {
        id: `temp-ai-${Date.now()}`,
        threadId,
        content: "",
        role: "assistant",
        createdAt: now,
        updatedAt: now,
      };

      // 乐观更新：在 React Query 内存中直接开辟格子（0ms 瞬间上屏）
      queryClient.setQueryData<MessageDto[]>(THREAD_QUERY_KEYS.messages(threadId), (old = []) => [
        ...old,
        tempUserMsg,
        tempAiMsg,
      ]);

      // 后台持续拉流并原地更新对应格子的内容（切走也不会中断）
      try {
        const stream = sendChatMessageStream({ message, threadId }, controller.signal);

        for await (const delta of stream) {
          queryClient.setQueryData<MessageDto[]>(THREAD_QUERY_KEYS.messages(threadId), (old = []) =>
            old.map((msg) =>
              msg.id === tempAiMsg.id ? { ...msg, content: msg.content + delta } : msg,
            ),
          );
        }
      } catch (error) {
        // 如果是用户主动点击“停止”触发的 abort，不视为异常
        if (!controller.signal.aborted) {
          const errorMsg = getErrorMessage(error, "请求失败");

          queryClient.setQueryData<MessageDto[]>(THREAD_QUERY_KEYS.messages(threadId), (old = []) =>
            old.map((msg) =>
              msg.id === tempAiMsg.id
                ? {
                    ...msg,
                    content: msg.content
                      ? `${msg.content}\n\n[异常中断：${errorMsg}]`
                      : `请求失败：${errorMsg}`,
                  }
                : msg,
            ),
          );
        }
      } finally {
        set((state) => {
          const next = { ...state.streams };
          delete next[threadId];
          return { streams: next };
        });

        queryClient.invalidateQueries({ queryKey: THREAD_QUERY_KEYS.all });
        queryClient.invalidateQueries({ queryKey: THREAD_QUERY_KEYS.messages(threadId) });
      }
    },
    // 暂停消息
    stopMessage: ({ threadId }) => {
      const current = get().streams[threadId];
      if (current?.abortController) {
        current.abortController.abort();
      }
      set(
        produce((state: ChatStore) => {
          const target = state.streams[threadId];
          if (target) {
            target.isGenerating = false;
            target.abortController = null;
          }
        }),
      );
    },
  };
});
