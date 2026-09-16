import { Bot, MessageSquarePlus, PanelLeft, User } from "lucide-react";
import { useRef, useState } from "react";

import { getErrorMessage, sendChatMessageStream } from "./api";
import { AISidebar, type SidebarResource } from "./components/agents/ai-sidebar";
import { ChatApp } from "./components/agents/chat-app";
import { ThinkingShimmer } from "./components/agents/loading-states/thinking-shimmer";
import {
  Message,
  MessageAvatar,
  MessageBubble,
  MessageBubbleContent,
  MessageContent,
  MessageGroup,
  MessageHeader,
} from "./components/agents/message";
import { MessageScroller } from "./components/agents/message-scroller";
import { PromptInput } from "./components/agents/prompt-input";
import { StreamingResponse } from "./components/agents/streaming-response";
import {
  AnimatedSidebar,
  AnimatedSidebarContent,
  AnimatedSidebarGroup,
  AnimatedSidebarGroupContent,
  AnimatedSidebarGroupLabel,
  AnimatedSidebarInset,
  AnimatedSidebarMenu,
  AnimatedSidebarMenuButton,
  AnimatedSidebarMenuItem,
  AnimatedSidebarTrigger,
} from "./components/motion/animated-sidebar";

type ChatItem = {
  id: string;
  from: "user" | "assistant";
  content: string;
  streaming?: boolean;
};

const INITIAL_SUSSIONS: SidebarResource[] = [
  {
    id: "thread-init-1",
    label: "初始欢迎对话",
    kind: "file",
  },
  {
    id: "thread-init-2",
    label: "对话二",
    kind: "file",
  },
];

export const App = () => {
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [sessions, setSessions] = useState<SidebarResource[]>(INITIAL_SUSSIONS);
  const [activeThreadId, setActiveThreadId] = useState<string>("thread-init-1");
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatItem[]>>({
    "thread-init-1": [{ id: "msg-1", from: "assistant", content: "会话一" }],
    "thread-init-2": [{ id: "msg-2", from: "assistant", content: "会话二" }],
  });

  const currentMessages = messagesMap[activeThreadId] ?? [];

  const abortControllerRef = useRef<AbortController | null>(null);

  const activeSesion = sessions.find((s) => s.id === activeThreadId);

  const updateSessionMessages = (
    targetThreadId: string,
    updater: (prev: ChatItem[]) => ChatItem[],
  ) => {
    setMessagesMap((prev) => ({ ...prev, [targetThreadId]: updater(prev[targetThreadId] ?? []) }));
  };

  const handleRenameSession = (item: SidebarResource, nextLabel: string) => {
    if (!nextLabel.trim()) return;
    setSessions((prev) =>
      prev.map((s) => (s.id === item.id ? { ...s, label: nextLabel.trim() } : s)),
    );
  };

  const handleNewSession = () => {
    const newThreadId = `thread-${Date.now()}`;

    const newSession: SidebarResource = {
      id: newThreadId,
      label: `新会话${sessions.length + 1}`,
      kind: "file",
    };

    setSessions((prev) => [newSession, ...prev]);
    setMessagesMap((prev) => ({
      ...prev,
      [newThreadId]: [
        { id: `welcome-${Date.now()}`, content: "你好，已为您开启新会话", from: "assistant" },
      ],
    }));

    setActiveThreadId(newThreadId);
  };

  const handleSelectSession = (threadId: string) => {
    if (threadId === activeThreadId) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setPending(false);
    }

    setActiveThreadId(threadId);
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    updateSessionMessages(activeThreadId, (prev) =>
      prev.map((msg) => (msg.streaming ? { ...msg, streaming: false } : msg)),
    );

    setPending(false);
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || pending) return;

    const currentThreadID = activeThreadId;

    // 1、用户发送
    const userMsg: ChatItem = { id: `user-${Date.now()}`, from: "user", content: text };
    updateSessionMessages(currentThreadID, (prev) => [...prev, userMsg]);

    setPending(true);
    setInput("");

    // 2、准备接受ai回复的占位
    const aiId = `ai-${Date.now()}`;
    const aiMsg: ChatItem = {
      id: aiId,
      from: "assistant",
      content: "",
      streaming: true,
    };
    updateSessionMessages(currentThreadID, (prev) => [...prev, aiMsg]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const stream = sendChatMessageStream(
        { message: text, threadId: currentThreadID },
        controller.signal,
      );

      for await (const delta of stream) {
        updateSessionMessages(currentThreadID, (prev) =>
          prev.map((msg) => (msg.id === aiId ? { ...msg, content: msg.content + delta } : msg)),
        );
      }

      updateSessionMessages(currentThreadID, (prev) =>
        prev.map((msg) => (msg.id === aiId ? { ...msg, streaming: false } : msg)),
      );
    } catch (error) {
      if (!controller.signal.aborted) {
        const errorMessage = getErrorMessage(error, "请求失败");
        updateSessionMessages(currentThreadID, (prev) =>
          prev.map((msg) =>
            msg.id === aiId
              ? {
                  ...msg,
                  content: msg.content
                    ? `${msg.content}\n\n[异常中断：${errorMessage}]`
                    : `请求失败:${errorMessage}`,
                }
              : msg,
          ),
        );
      }
    } finally {
      setPending(false);
      abortControllerRef.current = null;
      updateSessionMessages(currentThreadID, (prev) =>
        prev.map((msg) => (msg.id === aiId ? { ...msg, streaming: false } : msg)),
      );
    }
  };

  return (
    <ChatApp sidebarWidth="16rem" className="h-dvh w-full rounded-none border-0">
      {/* 侧边栏部分 */}
      <AnimatedSidebar collapsible="offcanvas">
        <AnimatedSidebarContent>
          {/* 新建会话等按钮 */}
          <AnimatedSidebarGroup>
            <AnimatedSidebarGroupContent>
              <AnimatedSidebarMenu>
                <AnimatedSidebarMenuItem>
                  <AnimatedSidebarMenuButton
                    icon={<MessageSquarePlus className="size-4" />}
                    onSelect={handleNewSession}
                    className="font-normal"
                  >
                    新建会话
                  </AnimatedSidebarMenuButton>
                </AnimatedSidebarMenuItem>
              </AnimatedSidebarMenu>
            </AnimatedSidebarGroupContent>
          </AnimatedSidebarGroup>

          {/* 会话列表 */}
          <AnimatedSidebarGroup>
            <AnimatedSidebarGroupLabel>历史会话</AnimatedSidebarGroupLabel>
            <AnimatedSidebarGroupContent>
              <AISidebar
                activeId={activeThreadId}
                items={sessions}
                onActiveChange={handleSelectSession}
                onItemsChange={setSessions}
                onRename={handleRenameSession}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-background to-transparent"
              />
            </AnimatedSidebarGroupContent>
          </AnimatedSidebarGroup>
        </AnimatedSidebarContent>
      </AnimatedSidebar>

      <AnimatedSidebarInset className="bg-background">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <AnimatedSidebarTrigger className="text-muted-foreground hover:bg-muted hover:text-foreground">
              <PanelLeft className="size-4" />
            </AnimatedSidebarTrigger>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {activeSesion?.label ?? "新会话"}
              </p>
              <p className="truncate text-[11px] text-foreground">ID: {activeThreadId}</p>
            </div>
          </div>
        </header>

        {/* 消息滚动区 */}
        <MessageScroller
          navigation="rail"
          className="flex-1"
          contentClassName="mx-auto max-w-3xl py-6 px-4"
        >
          <div className="flex flex-col gap-4">
            <MessageGroup spacing="default">
              {currentMessages.map(({ content, from, id, streaming }) => (
                // 消息部分
                <Message key={id} from={from} animateIn>
                  {/* 头像 */}
                  <MessageAvatar>
                    {from === "assistant" ? <Bot></Bot> : <User></User>}
                  </MessageAvatar>
                  {/* 名字 */}
                  <MessageContent>
                    <MessageHeader>
                      <span>{from === "assistant" ? "AI 智能体" : "你"}</span>{" "}
                    </MessageHeader>
                    {/* 内容 */}
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

        {/* 输入框 */}
        <div className="border-t border-border p-3">
          <div className="mx-auto max-w-3xl">
            <PromptInput
              value={input}
              onValueChange={setInput}
              onSubmit={handleSend}
              onStop={handleStop}
              loading={pending}
              placeholder={pending ? "AI 正在思考中…" : "输入消息，按回车发送…"}
            />
          </div>
        </div>
      </AnimatedSidebarInset>
    </ChatApp>
  );
};
