import type { MessageDto } from "@lg-lab/types";

import { getErrorMessage, sendChatMessageStream } from "@frontend/api";
import {
  Message,
  MessageAvatar,
  MessageBubble,
  MessageBubbleContent,
  MessageContent,
  MessageGroup,
  MessageHeader,
  MessageScroller,
  PromptInput,
  StreamingResponse,
  ThinkingShimmer,
} from "@frontend/components/agents";
import { AnimatedSidebarInset, AnimatedSidebarTrigger } from "@frontend/components/motion";
import { THREAD_QUERY_KEYS, useThreadMessages, useThreads } from "@frontend/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { Bot, PanelLeft, User } from "lucide-react";
import { useMemo, useRef, useState } from "react";

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

  // 获取当前会话的历史消息
  const { data: serverMessages = [] } = useThreadMessages(threadId);

  // 映射成组件库形式的数据
  const persistedMessages: ChatMessage[] = useMemo(
    () =>
      serverMessages.map((msg) => ({
        id: msg.id,
        from: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      })),
    [serverMessages],
  );

  // 输入框中文字的state
  const [draft, setDraft] = useState("");

  // 用户发出的消息
  const [sendingUserMessage, setSendingUserMessage] = useState<ChatMessage | null>(null);

  // AI生成中状态
  const [isGenerating, setIsGenerating] = useState(false);

  // 流式输出的ai消息
  const [streamingAiMessage, setStreamingAiMessage] = useState<ChatMessage | null>(null);

  // 界面合成消息：已落库的数据库消息 + 正在吐字的单条临时 AI 消息
  const displayedMessages = useMemo(() => {
    const list = [...persistedMessages];

    if (sendingUserMessage) {
      list.push(sendingUserMessage);
    }

    if (streamingAiMessage) {
      list.push(streamingAiMessage);
    }

    return list;
  }, [persistedMessages, streamingAiMessage, sendingUserMessage]);

  const abortControllerRef = useRef<AbortController | null>(null);

  // 停止生成
  const handleStop = () => {
    // 暂停
    abortControllerRef.current?.abort();
    // ref置空
    abortControllerRef.current = null;
    setIsGenerating(false);
    setStreamingAiMessage((prev) => (prev ? { ...prev, streaming: false } : null));
  };

  // 发送消息
  const handleSend = async (text: string) => {
    // 如果没打字不让发
    const trimmed = text.trim();
    if (!trimmed || isGenerating) return;

    let targetThreadId = threadId;

    // 如果是空状态，就新建一个会话
    if (!targetThreadId) {
      try {
        // 用前20个用户打的字当标题
        const title = trimmed.length > 20 ? `${trimmed.slice(0, 20)}...` : trimmed;
        // 调接口创一个会话
        const newThread = await createThread({ title });
        targetThreadId = newThread.id;
        // 通知路由层进行静默替换
        onThreadCreated?.(targetThreadId);
      } catch (error) {
        console.error("新建会话失败", error);
        return;
      }
    }
    // 置空输入框
    setDraft("");
    setIsGenerating(true);

    // 立即展示用户发出的消息与思考中占位气泡
    const now = Date.now();
    const userTempId = `user-temp-${now}`;
    const aiTempId = `ai-${now}`;

    setSendingUserMessage({ id: userTempId, from: "user", content: trimmed });
    setStreamingAiMessage({
      id: aiTempId,
      from: "assistant",
      content: "",
      streaming: true,
    });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 临时拿到后端流式实时返回的值，以便暂停时能展示
    let currentAiText = "";

    try {
      const stream = sendChatMessageStream(
        { message: text, threadId: targetThreadId },
        controller.signal,
      );

      for await (const delta of stream) {
        currentAiText += delta;
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
      const wasAborted = controller.signal.aborted;
      abortControllerRef.current = null;
      setIsGenerating(false);

      if (wasAborted) {
        // 中断的时候给目前ai吐的塞进缓存
        const userMsg: MessageDto = {
          id: userTempId,
          threadId: targetThreadId,
          role: "user",
          content: trimmed,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const aiMsg: MessageDto = {
          id: aiTempId,
          threadId: targetThreadId,
          role: "assistant",
          content: currentAiText,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        queryClient.setQueryData<MessageDto[]>(
          THREAD_QUERY_KEYS.messages(targetThreadId),
          (old = []) => [...old, userMsg, ...(aiMsg ? [aiMsg] : [])],
        );
      }

      // 正常结束：后端在流式中已将消息全部落库，失效缓存以重新拉取真实消息
      await queryClient.invalidateQueries({
        queryKey: THREAD_QUERY_KEYS.messages(targetThreadId),
      });

      // 清空本地两条临时状态
      setSendingUserMessage(null);
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
