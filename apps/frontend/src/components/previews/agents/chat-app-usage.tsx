"use client";

import {
  Bot,
  Clock3,
  FolderKanban,
  MessageSquarePlus,
  PanelLeft,
  Paperclip,
  Search,
  User,
  WandSparkles,
} from "lucide-react";
import { useReducedMotion } from "motion/react";
import { type ComponentProps, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AgentActivity } from "@/components/agents/agent-activity";
import { AISidebar, type SidebarResource } from "@/components/agents/ai-sidebar";
import {
  ApprovalCard,
  type ApprovalCardQuestion,
  type ApprovalCardStatus,
} from "@/components/agents/approval-card";
import { ChatApp } from "@/components/agents/chat-app";
import { CodeBlock } from "@/components/agents/code-block";
import { FileDiff } from "@/components/agents/file-diff";
import { ImageGeneration } from "@/components/agents/image-generation";
import { ThinkingShimmer } from "@/components/agents/loading-states/thinking-shimmer";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "@/components/agents/message";
import { MessageBubble, MessageBubbleContent } from "@/components/agents/message-bubble";
import { MessageScroller } from "@/components/agents/message-scroller";
import { PromptInput } from "@/components/agents/prompt-input";
import { StreamingResponse } from "@/components/agents/streaming-response";
import { TodoList, type TodoItem } from "@/components/agents/todo-list";
import {
  ToolApproval,
  ToolApprovalCode,
  type ToolApprovalStatus,
} from "@/components/agents/tool-approval";
import { ToolResult, ToolResultOutput } from "@/components/agents/tool-result";
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
  AnimatedSidebarRail,
  AnimatedSidebarTrigger,
} from "@/components/motion/animated-sidebar";
import { cn } from "@/lib/utils";

import { ThemeTogglePreview } from "../motion/theme-toggle.preview";

const resources: SidebarResource[] = [
  {
    id: "release",
    label: "发布工作区",
    kind: "project",
    children: [
      { id: "checkout", label: "结算流程审计", kind: "file" },
      { id: "release-notes", label: "发布说明", kind: "file" },
      { id: "references", label: "调研资料", kind: "bookmark" },
    ],
  },
  {
    id: "design",
    label: "设计系统",
    kind: "folder",
    children: [
      { id: "tokens", label: "动效规范", kind: "file" },
      { id: "components", label: "组件清单", kind: "file" },
    ],
  },
  { id: "archive", label: "归档记录", kind: "folder" },
];

const diffLines = [
  {
    id: "context-1",
    type: "context" as const,
    oldLine: 41,
    newLine: 41,
    content: "  const total = subtotal + shipping;",
  },
  {
    id: "removed-1",
    type: "removed" as const,
    oldLine: 42,
    content: "  return submitOrder(total);",
  },
  {
    id: "added-1",
    type: "added" as const,
    newLine: 42,
    content: "  const result = validateOrder({ total, items });",
  },
  {
    id: "added-2",
    type: "added" as const,
    newLine: 43,
    content: "  return result.ok ? submitOrder(total) : result;",
  },
];

const approvalQuestions: ApprovalCardQuestion[] = [
  {
    id: "release",
    title: "请确认本次修复补丁的发布方式：",
    options: [
      { value: "focused", label: "直接独立发布该结算修复补丁（推荐）" },
      { value: "bundle", label: "合并到下一个大版本中统一发布" },
    ],
    allowCustom: true,
    customPlaceholder: "输入其他自定义发布指令…",
  },
];

const reply =
  "好的，我将保持本次补丁的专注度，维持现有结算界面布局不变，并在最终发布前执行完整的自动化校验链路。";

interface AddedMessage {
  id: string;
  from: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

function GeneratedPreview() {
  return (
    <svg viewBox="0 0 640 420" aria-hidden="true" className="size-full">
      <rect width="640" height="420" fill="currentColor" className="text-muted" />
      <rect
        x="64"
        y="52"
        width="512"
        height="316"
        rx="28"
        fill="currentColor"
        className="text-background"
      />
      <circle cx="320" cy="144" r="38" fill="currentColor" className="text-emerald-500" />
      <path
        d="m301 144 13 13 26-29"
        fill="none"
        stroke="white"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="204"
        y="210"
        width="232"
        height="18"
        rx="9"
        fill="currentColor"
        className="text-foreground/85"
      />
      <rect
        x="238"
        y="246"
        width="164"
        height="12"
        rx="6"
        fill="currentColor"
        className="text-muted-foreground/35"
      />
      <rect
        x="248"
        y="298"
        width="144"
        height="34"
        rx="17"
        fill="currentColor"
        className="text-foreground"
      />
    </svg>
  );
}

function AssistantIdentity({ label = "AI 智能体" }: { label?: string }) {
  return (
    <MessageHeader>
      <span>{label}</span>
      <span>刚刚</span>
    </MessageHeader>
  );
}

export function ChatAppExample({ className }: Pick<ComponentProps<typeof ChatApp>, "className">) {
  const reduce = useReducedMotion() ?? false;
  const toolTimers = useRef<number[]>([]);
  const chatTimers = useRef<number[]>([]);
  const approvalTimers = useRef<number[]>([]);
  const runId = useRef(0);
  const [items, setItems] = useState(resources);
  const [activeResource, setActiveResource] = useState("checkout");
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [activeReply, setActiveReply] = useState<string | null>(null);
  const [messages, setMessages] = useState<AddedMessage[]>([]);
  const [toolStatus, setToolStatus] = useState<ToolApprovalStatus>("pending");
  const [approvalStatus, setApprovalStatus] = useState<ApprovalCardStatus>("pending");

  const clearToolTimers = useCallback(() => {
    toolTimers.current.forEach(window.clearTimeout);
    toolTimers.current = [];
  }, []);

  const clearChatTimers = useCallback(() => {
    chatTimers.current.forEach(window.clearTimeout);
    chatTimers.current = [];
  }, []);

  const clearApprovalTimers = useCallback(() => {
    approvalTimers.current.forEach(window.clearTimeout);
    approvalTimers.current = [];
  }, []);

  useEffect(
    () => () => {
      clearToolTimers();
      clearChatTimers();
      clearApprovalTimers();
    },
    [clearApprovalTimers, clearChatTimers, clearToolTimers],
  );

  const plan = useMemo<TodoItem[]>(() => {
    const checksStatus =
      toolStatus === "complete"
        ? "completed"
        : toolStatus === "running"
          ? "in-progress"
          : toolStatus === "denied" || toolStatus === "error"
            ? "cancelled"
            : "pending";
    return [
      {
        id: "inspect",
        title: "审计结算业务流程",
        status: "completed",
      },
      {
        id: "patch",
        title: "编写参数校验修复补丁",
        status: "completed",
      },
      { id: "checks", title: "执行定向自动化检查", status: checksStatus },
      {
        id: "review",
        title: "确认发布审批流程",
        status: toolStatus === "complete" ? "in-progress" : "pending",
      },
    ];
  }, [toolStatus]);

  useEffect(() => {
    if (!activeReply) return;

    if (reduce) {
      setMessages((current) =>
        current.map((message) =>
          message.id === activeReply ? { ...message, content: reply, streaming: false } : message,
        ),
      );
      setActiveReply(null);
      return;
    }

    const startedAt = performance.now();
    let frame = 0;
    const stream = (now: number) => {
      const cursor = Math.min(reply.length, Math.floor(((now - startedAt) / 1000) * 92));
      const content = reply.slice(0, cursor);
      setMessages((current) =>
        current.map((message) =>
          message.id === activeReply && message.content !== content
            ? { ...message, content }
            : message,
        ),
      );

      if (cursor < reply.length) {
        frame = requestAnimationFrame(stream);
      } else {
        setMessages((current) =>
          current.map((message) =>
            message.id === activeReply ? { ...message, streaming: false } : message,
          ),
        );
        setActiveReply(null);
      }
    };

    frame = requestAnimationFrame(stream);
    return () => cancelAnimationFrame(frame);
  }, [activeReply, reduce]);

  const approveTool = () => {
    clearToolTimers();
    setToolStatus("approving");
    toolTimers.current = [
      window.setTimeout(() => setToolStatus("approved"), 450),
      window.setTimeout(() => setToolStatus("running"), 850),
      window.setTimeout(() => setToolStatus("complete"), 1650),
    ];
  };

  const submit = (value: string) => {
    if (!value.trim() || pending || activeReply) return;
    const id = runId.current++;
    const assistantId = `assistant-${id}`;
    setMessages((current) => [...current, { id: `user-${id}`, from: "user", content: value }]);
    setInput("");
    setPending(true);
    chatTimers.current.push(
      window.setTimeout(
        () => {
          setMessages((current) => [
            ...current,
            {
              id: assistantId,
              from: "assistant",
              content: "",
              streaming: true,
            },
          ]);
          setPending(false);
          setActiveReply(assistantId);
        },
        reduce ? 0 : 420,
      ),
    );
  };

  const stop = () => {
    clearChatTimers();
    setPending(false);
    setMessages((current) =>
      current.map((message) => (message.streaming ? { ...message, streaming: false } : message)),
    );
    setActiveReply(null);
  };

  const busy = pending || activeReply !== null;

  return (
    <ChatApp sidebarWidth="17rem" className={cn("h-[760px]", className)}>
      <AnimatedSidebar
        ariaLabel="智能体工作区"
        collapsible="offcanvas"
        className="min-h-0"
        panelClassName="h-full bg-background"
      >
        <AnimatedSidebarContent className="gap-4 overflow-hidden px-2 py-4">
          <AnimatedSidebarGroup className="shrink-0 px-1 py-0">
            <AnimatedSidebarGroupContent>
              <AnimatedSidebarMenu className="gap-1">
                {[
                  { label: "新建任务", icon: MessageSquarePlus },
                  { label: "全站搜索", icon: Search },
                  { label: "运行记录", icon: Clock3 },
                ].map(({ label, icon: Icon }) => (
                  <AnimatedSidebarMenuItem key={label}>
                    <AnimatedSidebarMenuButton
                      icon={<Icon className="size-4" />}
                      onSelect={() => {}}
                      className="font-normal"
                    >
                      {label}
                    </AnimatedSidebarMenuButton>
                  </AnimatedSidebarMenuItem>
                ))}
              </AnimatedSidebarMenu>
            </AnimatedSidebarGroupContent>
          </AnimatedSidebarGroup>

          <AnimatedSidebarGroup className="min-h-0 flex-1 px-1 py-0">
            <AnimatedSidebarGroupLabel className="mb-1 h-8 px-2 text-xs font-medium tracking-normal normal-case">
              项目列表
            </AnimatedSidebarGroupLabel>
            <AnimatedSidebarGroupContent className="relative min-h-0 flex-1 overflow-hidden">
              <div className="scrollbar-none` h-full overflow-y-auto overscroll-contain pb-8 [overflow-anchor:none] [&::-webkit-scrollbar]:hidden">
                <AISidebar
                  items={items}
                  activeId={activeResource}
                  defaultExpandedIds={["release", "design"]}
                  onActiveChange={setActiveResource}
                  onItemsChange={setItems}
                />
              </div>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent"
              />
            </AnimatedSidebarGroupContent>
          </AnimatedSidebarGroup>
        </AnimatedSidebarContent>
        <AnimatedSidebarRail />
      </AnimatedSidebar>

      <AnimatedSidebarInset className="min-h-0 bg-background">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          {/* 左侧：侧边栏触发器 + 标题 */}
          <div className="flex min-w-0 items-center gap-2.5">
            <AnimatedSidebarTrigger className="text-muted-foreground hover:bg-muted hover:text-foreground">
              <PanelLeft className="size-4" />
            </AnimatedSidebarTrigger>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">结算模块发布</p>
              <p className="truncate text-[11px] text-muted-foreground">
                智能体工作区 · 定向修复补丁
              </p>
            </div>
          </div>

          {/* 👉 右侧：状态徽章 + 主题切换按钮 */}
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              已连接
            </span>
            <ThemeTogglePreview></ThemeTogglePreview>
          </div>
        </header>

        <MessageScroller
          busy={busy}
          navigation="rail"
          className="min-h-0 flex-1"
          viewportClassName="px-3 py-5 sm:px-5"
          contentClassName="mx-auto min-h-full w-full max-w-3xl"
        >
          <MessageGroup spacing="default">
            <Message from="user">
              <MessageAvatar>
                <User />
              </MessageAvatar>
              <MessageContent>
                <MessageHeader>
                  <span>你</span>
                  <span>10:24</span>
                </MessageHeader>
                <MessageBubble variant="solid">
                  <MessageBubbleContent>
                    审计结算流程，修复表单校验漏洞，并准备可直接发布的补丁。
                  </MessageBubbleContent>
                </MessageBubble>
              </MessageContent>
            </Message>

            <Message from="assistant">
              <MessageAvatar>
                <Bot />
              </MessageAvatar>
              <MessageContent className="gap-3">
                <MessageHeader>
                  <span>AI 智能体</span>
                  <span>10:24</span>
                </MessageHeader>
                <AgentActivity
                  status="complete"
                  duration={6}
                  defaultOpen
                  collapseOnComplete={false}
                  items={[
                    {
                      id: "reason",
                      type: "text",
                      content: "正在追踪结算提交路径与校验边界。",
                    },
                    {
                      id: "read",
                      type: "tool",
                      action: "read",
                      target: "checkout/submit.ts",
                    },
                    {
                      id: "search",
                      type: "search",
                      query: "订单校验失败处理方案",
                      results: [
                        {
                          id: "result-1",
                          title: "智能体界面设计指南",
                          domain: "beui.dev",
                          url: "/docs/ai-agents",
                        },
                      ],
                    },
                  ]}
                />
                <TodoList items={plan} title="发布计划" collapseOnComplete={false} />
              </MessageContent>
            </Message>

            <Message from="assistant">
              <MessageAvatar placeholder />
              <MessageContent>
                <ToolApproval
                  tool="terminal.run"
                  title="允许运行结算自动化检查？"
                  description="智能体需要获取权限以运行校验与无障碍自动化测试套件。"
                  status={toolStatus}
                  defaultOpen
                  parameters={[
                    {
                      id: "command",
                      label: "执行命令",
                      value: (
                        <ToolApprovalCode code="bun test checkout --coverage" language="bash" />
                      ),
                    },
                    { id: "scope", label: "运行作用域", value: "当前工作区" },
                  ]}
                  onApprove={approveTool}
                  onAlwaysAllow={approveTool}
                  onDeny={() => {
                    clearToolTimers();
                    setToolStatus("denied");
                  }}
                />
              </MessageContent>
            </Message>

            {toolStatus === "running" || toolStatus === "complete" ? (
              <Message from="assistant" animateIn>
                <MessageAvatar placeholder />
                <MessageContent className="gap-3">
                  <ToolResult
                    tool="terminal.run"
                    title={
                      toolStatus === "running" ? "正在运行结算检查..." : "结算自动化检查全部通过"
                    }
                    status={toolStatus === "running" ? "running" : "success"}
                    kind="terminal"
                    meta={toolStatus === "running" ? "实时" : "2.8秒"}
                    defaultOpen
                    collapseOnComplete={false}
                  >
                    <ToolResultOutput>
                      {toolStatus === "running"
                        ? "✓ 校验规则契约测试通过\n… 结算键盘导航流程测试中"
                        : "✓ 校验规则契约测试通过\n✓ 结算键盘导航流程测试通过\n✓ 订单提交异常恢复测试通过"}
                    </ToolResultOutput>
                  </ToolResult>
                  {toolStatus === "complete" ? (
                    <>
                      <FileDiff
                        file="checkout/submit.ts"
                        lines={diffLines}
                        status="complete"
                        defaultOpen
                        collapseOnComplete={false}
                      />
                      <CodeBlock
                        filename="validation.ts"
                        language="typescript"
                        status="complete"
                        code={
                          "export function validateOrder(order: Order) {\n  return schema.safeParse(order);\n}"
                        }
                        showLineNumbers
                      />
                    </>
                  ) : null}
                </MessageContent>
              </Message>
            ) : toolStatus === "denied" || toolStatus === "error" ? (
              <Message from="assistant" animateIn>
                <MessageAvatar placeholder />
                <MessageContent>
                  <ToolResult
                    tool="terminal.run"
                    title="结算检查未执行"
                    status={toolStatus === "denied" ? "cancelled" : "error"}
                    kind="terminal"
                    defaultOpen
                    collapseOnComplete={false}
                  >
                    <ToolResultOutput>
                      {toolStatus === "denied"
                        ? "未获得执行权限，已跳过命令运行。"
                        : "命令执行未能完成。"}
                    </ToolResultOutput>
                  </ToolResult>
                </MessageContent>
              </Message>
            ) : null}

            {toolStatus === "complete" ? (
              <Message from="assistant" animateIn>
                <MessageAvatar placeholder />
                <MessageContent className="gap-3">
                  <ImageGeneration
                    status="complete"
                    prompt="清晰直观的结算完成确认页设计"
                    resolution="1280 × 840"
                    size="compact"
                  >
                    <GeneratedPreview />
                  </ImageGeneration>
                  <MessageBubble variant="ghost" className="w-full">
                    <MessageBubbleContent>
                      <StreamingResponse
                        status="complete"
                        copyText="结算流程补丁已准备就绪，请查阅。"
                        sources={[
                          {
                            id: "message",
                            title: "消息组件架构",
                            domain: "beui.dev",
                            url: "/components/agents/message",
                          },
                          {
                            id: "diff",
                            title: "代码变更比对",
                            domain: "beui.dev",
                            url: "/components/agents/file-diff",
                          },
                          {
                            id: "approval",
                            title: "工具调用审批",
                            domain: "beui.dev",
                            url: "/components/agents/tool-approval",
                          },
                        ]}
                      >
                        <p>结算流程补丁已准备就绪，请查阅：</p>
                        <ul>
                          <li>提交订单前已强制执行有效性校验。</li>
                          <li>错误提示信息内嵌于当前流程中友好展示。</li>
                          <li>定向测试已全部通过，未破坏原有页面布局。</li>
                        </ul>
                      </StreamingResponse>
                    </MessageBubbleContent>
                  </MessageBubble>
                </MessageContent>
              </Message>
            ) : null}

            {toolStatus === "complete" ? (
              <Message from="assistant" animateIn>
                <MessageAvatar placeholder />
                <MessageContent>
                  <ApprovalCard
                    questions={approvalQuestions}
                    status={approvalStatus}
                    onSubmit={() => {
                      setApprovalStatus("submitting");
                      clearApprovalTimers();
                      approvalTimers.current.push(
                        window.setTimeout(() => setApprovalStatus("answered"), 650),
                      );
                    }}
                    result="发布决策指令已发送给智能体。"
                  />
                </MessageContent>
              </Message>
            ) : null}

            {messages.map((message) => (
              <Message key={message.id} from={message.from} animateIn>
                {message.from === "assistant" ? (
                  <MessageAvatar>
                    <Bot />
                  </MessageAvatar>
                ) : (
                  <MessageAvatar>
                    <User />
                  </MessageAvatar>
                )}
                <MessageContent>
                  {message.from === "assistant" ? <AssistantIdentity label="AI 智能体" /> : null}
                  <MessageBubble variant={message.from === "user" ? "solid" : "soft"}>
                    <MessageBubbleContent>
                      {message.from === "assistant" ? (
                        <StreamingResponse
                          status={message.streaming ? "streaming" : "complete"}
                          showActions={!message.streaming}
                          copyText={message.content}
                        >
                          {message.content}
                        </StreamingResponse>
                      ) : (
                        message.content
                      )}
                    </MessageBubbleContent>
                  </MessageBubble>
                  {message.from === "user" ? <MessageFooter>已发送</MessageFooter> : null}
                </MessageContent>
              </Message>
            ))}

            {pending ? (
              <Message from="assistant" animateIn>
                <MessageAvatar>
                  <Bot />
                </MessageAvatar>
                <MessageContent>
                  <ThinkingShimmer>正在分析您的指令并规划下一步...</ThinkingShimmer>
                </MessageContent>
              </Message>
            ) : null}
          </MessageGroup>
        </MessageScroller>

        <div className="shrink-0 border-t border-border bg-background p-3">
          <div className="mx-auto max-w-3xl">
            <PromptInput
              value={input}
              onValueChange={setInput}
              loading={busy}
              onStop={stop}
              onSubmit={submit}
              minRows={1}
              maxRows={4}
              placeholder="输入消息，让智能体继续执行…"
              models={[
                { value: "balanced", label: "标准均衡" },
                { value: "fast", label: "极速响应" },
                { value: "deep", label: "深度思考" },
              ]}
              defaultModel="balanced"
              actions={[
                { value: "attach", label: "上传附件", icon: <Paperclip /> },
                {
                  value: "project",
                  label: "关联项目上下文",
                  icon: <FolderKanban />,
                },
                {
                  value: "skill",
                  label: "调用技能库",
                  icon: <WandSparkles />,
                },
              ]}
            />
          </div>
        </div>
      </AnimatedSidebarInset>
    </ChatApp>
  );
}
