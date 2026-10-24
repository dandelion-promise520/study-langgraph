import { useThreadMessages } from "@frontend/hooks";
import { useChatStore } from "@frontend/stores/chat";
import { ThinkingShimmer } from "@frontend/vendor/agents/loading-states/thinking-shimmer";
import {
  Message,
  MessageAvatar,
  MessageBubble,
  MessageBubbleContent,
  MessageContent,
  MessageGroup,
  MessageHeader,
  MessageScroller,
} from "@frontend/vendor/agents/message";
import { PromptInput } from "@frontend/vendor/agents/prompt-input";
import { StreamingResponse } from "@frontend/vendor/agents/streaming-response";
import { AnimatedSidebarInset, AnimatedSidebarTrigger } from "@frontend/vendor/motion";
import { ThemeToggle } from "@frontend/vendor/motion/theme-toggle";
import { useQueryClient } from "@tanstack/react-query";
import { Bot, PanelLeft, User } from "lucide-react";
import { useState } from "react";

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

  const isGenerating = useChatStore((state) =>
    threadId ? (state.streams[threadId]?.isGenerating ?? false) : false,
  );
  // 获取当前会话的历史消息
  const { data: messages = [] } = useThreadMessages({ threadId });

  // 找到哪条消息正在打字
  let streamingMessageId: string | null = null;

  if (isGenerating) {
    const lastMessage = messages.at(-1);
    if (lastMessage?.role === "assistant") {
      streamingMessageId = lastMessage.id;
    }
  }

  // 输入框中文字的state
  const [draft, setDraft] = useState("");

  // 停止生成
  const handleStop = () => {
    if (threadId) {
      useChatStore.getState().stopMessage({ threadId });
    }
  };

  // 发送消息
  const handleSend = async (text: string) => {
    // 如果没打字不让发
    const trimmed = text.trim();
    if (!trimmed || isGenerating) return;

    // 本地直接生成 UUIDv4
    const targetThreadId = threadId ?? crypto.randomUUID();

    // 如果之前处于根路由，立即通知路由进行静默更新
    if (!threadId) {
      onThreadCreated?.(targetThreadId);
    }
    // 置空输入框
    setDraft("");

    useChatStore
      .getState()
      .sendMessage({ message: trimmed, queryClient, threadId: targetThreadId });
  };

  return (
    <AnimatedSidebarInset className="bg-background">
      {/* 顶部标题栏 */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <AnimatedSidebarTrigger className="text-muted-foreground hover:bg-muted hover:text-foreground">
            <PanelLeft className="size-3.5" />
          </AnimatedSidebarTrigger>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {threadTitle ?? "新会话"}
            </p>
          </div>
        </div>
        <ThemeToggle variant="circle-blur" start="top-right" className="cursor-pointer" />
      </header>

      {/* 消息滚动列表 */}
      <MessageScroller
        navigation="rail"
        className="flex-1"
        contentClassName="mx-auto max-w-3xl py-6 px-4"
      >
        <div className="flex flex-col gap-4">
          <MessageGroup spacing="default">
            {messages.map(({ content, id, role: from }) => {
              const isStreaming = id === streamingMessageId;
              return (
                <Message key={id} from={from} animateIn>
                  <MessageAvatar>
                    {from === "assistant" ? (
                      <Bot className="size-3.5" />
                    ) : (
                      <User className="size-3.5" />
                    )}
                  </MessageAvatar>
                  <MessageContent>
                    <MessageHeader>
                      <span>{from === "assistant" ? "AI 智能体" : "你"}</span>
                    </MessageHeader>
                    <MessageBubble variant={from === "assistant" ? "soft" : "solid"}>
                      <MessageBubbleContent>
                        {from === "assistant" ? (
                          isStreaming && !content ? (
                            <ThinkingShimmer />
                          ) : (
                            <StreamingResponse
                              status={isStreaming ? "streaming" : "complete"}
                              showActions={!isStreaming}
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
              );
            })}
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
