import { useQueryClient } from "@tanstack/react-query";
import { Bot, PanelLeft, User } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { getErrorMessage, sendChatMessageStream } from "@/api";
import { ThinkingShimmer } from "@/components/agents/loading-states/thinking-shimmer";
import {
  Message,
  MessageAvatar,
  MessageBubble,
  MessageBubbleContent,
  MessageContent,
  MessageGroup,
  MessageHeader,
} from "@/components/agents/message";
import { MessageScroller } from "@/components/agents/message-scroller";
import { PromptInput } from "@/components/agents/prompt-input";
import { StreamingResponse } from "@/components/agents/streaming-response";
import { AnimatedSidebarInset, AnimatedSidebarTrigger } from "@/components/motion/animated-sidebar";
import { THREAD_QUERY_KEYS, useThreadMessages, useThreads } from "@/hooks/thread";

export type ChatMessage = {
  id: string;
  from: "user" | "assistant";
  content: string;
  streaming?: boolean;
};

interface ChatPaneProps {
  threadId: string | null;
  threadTitle?: string;
  onThreadCreated?: (newThreadId: string) => void;
}

export const ChatPane = ({ threadId, threadTitle, onThreadCreated }: ChatPaneProps) => {
  const queryClient = useQueryClient();
  const { createThread } = useThreads();

  // 1. 获取当前会话的历史消息（threadId 必有值，不再需要任何判空与 skipToken）
  const { data: serverMessages = [] } = useThreadMessages(threadId);

  const persistedMessages: ChatMessage[] = useMemo(
    () =>
      serverMessages.map((msg) => ({
        id: msg.id,
        from: msg.role === "user" ? ("user" as const) : ("assistant" as const),
        content: msg.content,
      })),
    [serverMessages],
  );

  // 2. 本地瞬时状态（完全局限于当前会话，不再需要任何复杂字典！）
  const [draft, setDraft] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingAiMessage, setStreamingAiMessage] = useState<ChatMessage | null>(null);

  // 3. 界面合成消息：已落库的数据库消息 + 正在吐字的单条临时 AI 消息
  const displayedMessages = useMemo(() => {
    if (!streamingAiMessage) return persistedMessages;
    return [...persistedMessages, streamingAiMessage];
  }, [persistedMessages, streamingAiMessage]);

  const abortControllerRef = useRef<AbortController | null>(null);

  // 4. 停止生成（无需判空，直接操作）
  const handleStop = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsGenerating(false);
    setStreamingAiMessage((prev) => (prev ? { ...prev, streaming: false } : null));
  };

  // 5. 发送消息（无需判空，直接发起流式）
  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isGenerating) return;

    let targetThreadId = threadId;

    // 如果是空状态，就新建一个会话
    if (!targetThreadId) {
      try {
        const title = trimmed.length > 20 ? `${trimmed.slice(0, 20)}...` : trimmed;
        const newThread = await createThread({ title });
        targetThreadId = newThread.id;
        // 通知路由层进行静默替换或跳转
        onThreadCreated?.(targetThreadId);
      } catch (error) {
        console.error("新建会话失败", error);
        return;
      }
    }

    setDraft("");
    setIsGenerating(true);

    const now = Date.now();
    const aiId = `ai-${now}`;
    // 立即展示思考中占位气泡
    setStreamingAiMessage({ id: aiId, from: "assistant", content: "", streaming: true });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const stream = sendChatMessageStream(
        { message: text, threadId: targetThreadId },
        controller.signal,
      );

      for await (const delta of stream) {
        setStreamingAiMessage((prev) => (prev ? { ...prev, content: prev.content + delta } : null));
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        const errorMessage = getErrorMessage(error, "请求失败");
        setStreamingAiMessage((prev) =>
          prev
            ? {
                ...prev,
                content: prev.content
                  ? `${prev.content}\n\n[异常中断：${errorMessage}]`
                  : `请求失败: ${errorMessage}`,
              }
            : null,
        );
      }
    } finally {
      abortControllerRef.current = null;
      setIsGenerating(false);

      // 核心对齐：后端在流式中已将消息全部落库，失效缓存以重新拉取真实消息
      await queryClient.invalidateQueries({
        queryKey: THREAD_QUERY_KEYS.messages(targetThreadId),
      });

      // 清空打字机临时状态，平滑过渡给 persistedMessages
      setStreamingAiMessage(null);
    }
  };

  return (
    <AnimatedSidebarInset className="bg-background">
      {/* 顶部标题栏 */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <AnimatedSidebarTrigger className="text-muted-foreground hover:bg-muted hover:text-foreground">
            <PanelLeft className="size-4" />
          </AnimatedSidebarTrigger>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {threadTitle ?? "新会话"}
            </p>
          </div>
        </div>
      </header>

      {/* 消息滚动列表 */}
      <MessageScroller
        navigation="rail"
        className="flex-1"
        contentClassName="mx-auto max-w-3xl py-6 px-4"
      >
        <div className="flex flex-col gap-4">
          <MessageGroup spacing="default">
            {displayedMessages.map(({ content, from, id, streaming }) => (
              <Message key={id} from={from} animateIn>
                <MessageAvatar>
                  {from === "assistant" ? <Bot className="size-4" /> : <User className="size-4" />}
                </MessageAvatar>
                <MessageContent>
                  <MessageHeader>
                    <span>{from === "assistant" ? "AI 智能体" : "你"}</span>
                  </MessageHeader>
                  <MessageBubble variant={from === "assistant" ? "soft" : "solid"}>
                    <MessageBubbleContent>
                      {from === "assistant" ? (
                        streaming && !content ? (
                          <ThinkingShimmer />
                        ) : (
                          <StreamingResponse
                            status={streaming ? "streaming" : "complete"}
                            showActions={!streaming}
                            copyText={content}
                          >
                            {content}
                          </StreamingResponse>
                        )
                      ) : (
                        content
                      )}
                    </MessageBubbleContent>
                  </MessageBubble>
                </MessageContent>
              </Message>
            ))}
          </MessageGroup>
        </div>
      </MessageScroller>

      {/* 底部输入框 */}
      <div className="border-t border-border p-3">
        <div className="mx-auto max-w-3xl">
          <PromptInput
            value={draft}
            onValueChange={setDraft}
            onSubmit={handleSend}
            onStop={handleStop}
            loading={isGenerating}
            placeholder={isGenerating ? "AI 正在思考中…" : "输入消息，按回车发送…"}
          />
        </div>
      </div>
    </AnimatedSidebarInset>
  );
};
