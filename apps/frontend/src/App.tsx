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

type ChatMessage = {
  id: string;
  from: "user" | "assistant";
  content: string;
  streaming?: boolean;
};

// 一个会话的运行时数据：消息、草稿、是否正在生成
type ThreadState = {
  messages: ChatMessage[];
  draft: string;
  isGenerating: boolean;
};

// 模块级复用的空会话：未初始化的 threadId 会频繁命中这里，
// 复用同一个引用可以避免每次现造对象，也让引用比较保持稳定
const EMPTY_THREAD: ThreadState = { messages: [], draft: "", isGenerating: false };

const INITIAL_SESSIONS: SidebarResource[] = [
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
  const [sessions, setSessions] = useState<SidebarResource[]>(INITIAL_SESSIONS);
  const [activeThreadId, setActiveThreadId] = useState<string>("thread-init-1");
  const [threads, setThreads] = useState<Record<string, ThreadState>>({
    "thread-init-1": {
      messages: [{ id: "msg-1", from: "assistant", content: "会话一" }],
      draft: "",
      isGenerating: false,
    },
    "thread-init-2": {
      messages: [{ id: "msg-2", from: "assistant", content: "会话二" }],
      draft: "",
      isGenerating: false,
    },
  });

  // 兜底只写这一处：任何未初始化的会话都落到 EMPTY_THREAD 上
  const activeThread = threads[activeThreadId] ?? EMPTY_THREAD;

  // 每个会话各自持有一条流的 controller；用 Map 而不是单个 ref，
  // 是因为切走会话不会中止生成，可能同时有多条流在跑
  const abortControllersRef = useRef(new Map<string, AbortController>());

  const activeSession = sessions.find((s) => s.id === activeThreadId);

  const updateThread = (threadId: string, updater: (prev: ThreadState) => ThreadState) => {
    setThreads((prev) => ({ ...prev, [threadId]: updater(prev[threadId] ?? EMPTY_THREAD) }));
  };

  const updateMessage = (
    threadId: string,
    messageId: string,
    updater: (msg: ChatMessage) => ChatMessage,
  ) => {
    updateThread(threadId, (prev) => ({
      ...prev,
      messages: prev.messages.map((m) => (m.id === messageId ? updater(m) : m)),
    }));
  };

  const setActiveInput = (next: string) => {
    updateThread(activeThreadId, (prev) => ({ ...prev, draft: next }));
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
    setThreads((prev) => ({
      ...prev,
      [newThreadId]: {
        messages: [
          { id: `welcome-${Date.now()}`, content: "你好，已为您开启新会话", from: "assistant" },
        ],
        draft: "",
        isGenerating: false,
      },
    }));

    setActiveThreadId(newThreadId);
  };

  // 切换会话不中止生成：流在后台继续跑，切回来能看到完整回复
  const handleSelectSession = (threadId: string) => {
    if (threadId === activeThreadId) return;

    setActiveThreadId(threadId);
  };

  const handleStop = () => {
    const controller = abortControllersRef.current.get(activeThreadId);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(activeThreadId);
    }

    // 停止是无条件的：按下停止就该回到"没在跑"，
    // 不依赖此刻读到的 isGenerating 值
    updateThread(activeThreadId, (prev) => ({
      ...prev,
      isGenerating: false,
      messages: prev.messages.map((msg) => (msg.streaming ? { ...msg, streaming: false } : msg)),
    }));
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || activeThread.isGenerating) return;

    // 进入函数后立刻固定目标会话：这条流是异步的，
    // 期间用户可能切走，后续所有写入都必须落回发起时的那个会话
    const currentThreadID = activeThreadId;

    const now = Date.now();
    const userMsg: ChatMessage = { id: `user-${now}`, from: "user", content: text };
    const aiId = `ai-${now}`;
    const aiMsg: ChatMessage = { id: aiId, from: "assistant", content: "", streaming: true };

    // 一次 setState 完成三件事：追加两条消息、清空草稿、标记生成中。
    // 拆成多次 setState 会产生"消息已追加但还没标记生成中"的中间态
    updateThread(currentThreadID, (prev) => ({
      ...prev,
      messages: [...prev.messages, userMsg, aiMsg],
      draft: "",
      isGenerating: true,
    }));

    const controller = new AbortController();
    abortControllersRef.current.set(currentThreadID, controller);

    try {
      const stream = sendChatMessageStream(
        { message: text, threadId: currentThreadID },
        controller.signal,
      );

      for await (const delta of stream) {
        updateMessage(currentThreadID, aiId, (msg) => ({
          ...msg,
          content: msg.content + delta,
        }));
      }
    } catch (error) {
      // abort 会让 for await 抛错，但这是用户主动停止，不应显示为请求失败
      if (!controller.signal.aborted) {
        const errorMessage = getErrorMessage(error, "请求失败");
        updateMessage(currentThreadID, aiId, (msg) => ({
          ...msg,
          content: msg.content
            ? `${msg.content}\n\n[异常中断：${errorMessage}]`
            : `请求失败:${errorMessage}`,
        }));
      }
    } finally {
      // 按 threadId 删除，而不是清空整张表：
      // 此时可能还有别的会话的流在跑，清空会让它们失去停止能力
      abortControllersRef.current.delete(currentThreadID);

      updateThread(currentThreadID, (prev) => ({ ...prev, isGenerating: false }));
      updateMessage(currentThreadID, aiId, (msg) => ({ ...msg, streaming: false }));
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
                {activeSession?.label ?? "新会话"}
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
              {activeThread.messages.map(({ content, from, id, streaming }) => (
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
              value={activeThread.draft}
              onValueChange={setActiveInput}
              onSubmit={handleSend}
              onStop={handleStop}
              loading={activeThread.isGenerating}
              placeholder={activeThread.isGenerating ? "AI 正在思考中…" : "输入消息，按回车发送…"}
            />
          </div>
        </div>
      </AnimatedSidebarInset>
    </ChatApp>
  );
};
