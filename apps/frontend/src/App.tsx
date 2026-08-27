import { useReducedMotion } from "motion/react";
import type { ComponentProps } from "react";

import type { SidebarResource } from "@/components/agents/ai-sidebar";
import { ChatApp } from "@/components/agents/chat-app";
import { MessageGroup } from "@/components/agents/message";
import { MessageScroller } from "@/components/agents/message-scroller";
import {
  AppHeader,
  AppSidebar,
  AuditTimeline,
  ChatInputBar,
  DynamicMessages,
} from "@/components/chat-workspace";
import { AnimatedSidebarInset } from "@/components/motion/animated-sidebar";
import {
  useAgentChat,
  useDecisionApproval,
  useToolWorkflow,
  useWorkspaceState,
} from "@/hooks";
import { cn } from "@/lib/utils";

// ==========================================
// 1. 初始模拟配置数据
// ==========================================

/** 侧边栏工作区资源树结构 */
const initialResources: SidebarResource[] = [
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

/** 模拟智能体流式打字回复文本模板 */
const replyTemplate =
  "好的，我将保持本次补丁的专注度，维持现有结算界面布局不变，并在最终发布前执行完整的自动化校验链路。";

// ==========================================
// 2. 主应用组件 (App)
// ==========================================

/**
 * 【主应用页面: App】
 * 
 * 学习要点与架构设计：
 * 1. 状态与逻辑完全由自定义 Hooks 驱动 (hooks/)：
 *    - useWorkspaceState: 管理侧栏树与命令面板
 *    - useToolWorkflow: 管理工具审批状态机与 TodoList 动态联动
 *    - useDecisionApproval: 管理发布决策审批卡片
 *    - useAgentChat: 管理消息流式生成、打断与输入
 * 
 * 2. 界面展示完全由领域子组件承载 (components/chat-workspace/)：
 *    - AppSidebar: 侧边栏及全局快捷指令
 *    - AppHeader: 顶部面包屑与主题切换
 *    - AuditTimeline: 模拟工作流静态时间线
 *    - DynamicMessages: 动态对话历史与打字流
 *    - ChatInputBar: 底部 Prompt 输入栏
 */
export function App({ className }: Pick<ComponentProps<typeof ChatApp>, "className">) {
  // ① 减弱动效偏好：用于针对系统无障碍设置降级动效
  const reduceMotion = useReducedMotion() ?? false;

  // ② 状态管理 Hooks
  const {
    items,
    setItems,
    activeResource,
    setActiveResource,
    commandOpen,
    setCommandOpen,
  } = useWorkspaceState(initialResources, "checkout");

  const { toolStatus, plan, approveTool, denyTool } = useToolWorkflow("pending");

  const { approvalStatus, submitApproval } = useDecisionApproval("pending");

  const { messages, input, setInput, pending, busy, submit, stop } = useAgentChat(
    replyTemplate,
    reduceMotion,
  );

  return (
    <ChatApp sidebarWidth="17rem" className={cn("h-dvh", className)}>
      {/* 1. 左侧工作区导航栏 */}
      <AppSidebar
        items={items}
        activeResource={activeResource}
        commandOpen={commandOpen}
        onItemsChange={setItems}
        onActiveResourceChange={setActiveResource}
        onCommandOpenChange={setCommandOpen}
      />

      {/* 2. 主体工作区容器 */}
      <AnimatedSidebarInset className="min-h-0 bg-background">
        {/* 顶部标题栏 */}
        <AppHeader
          title="结算模块发布"
          subtitle="智能体工作区 · 定向修复补丁"
        />

        {/* 消息滚动浏览区 */}
        <MessageScroller
          busy={busy}
          navigation="rail"
          className="min-h-0 flex-1"
          viewportClassName="px-3 py-5 sm:px-5"
          contentClassName="mx-auto min-h-full w-full max-w-3xl"
        >
          <MessageGroup spacing="default">
            {/* 工作流演示时间线（活动轨迹、计划清单、审批卡片、代码比对、图片生成） */}
            <AuditTimeline
              plan={plan}
              toolStatus={toolStatus}
              approvalStatus={approvalStatus}
              onApproveTool={approveTool}
              onDenyTool={denyTool}
              onSubmitApproval={submitApproval}
            />

            {/* 动态追加的用户与智能体消息列表 */}
            <DynamicMessages
              messages={messages}
              pending={pending}
            />
          </MessageGroup>
        </MessageScroller>

        {/* 底部 Prompt 提示词输入栏 */}
        <ChatInputBar
          value={input}
          loading={busy}
          onValueChange={setInput}
          onSubmit={submit}
          onStop={stop}
        />
      </AnimatedSidebarInset>
    </ChatApp>
  );
}
