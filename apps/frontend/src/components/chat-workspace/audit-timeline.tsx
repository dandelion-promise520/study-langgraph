import { Bot, User } from "lucide-react";

import { AgentActivity } from "@/components/agents/agent-activity";
import {
  ApprovalCard,
  type ApprovalCardQuestion,
  type ApprovalCardStatus,
} from "@/components/agents/approval-card";
import { CodeBlock } from "@/components/agents/code-block";
import { FileDiff } from "@/components/agents/file-diff";
import { ImageGeneration } from "@/components/agents/image-generation";
import { Message, MessageAvatar, MessageContent, MessageHeader } from "@/components/agents/message";
import { MessageBubble, MessageBubbleContent } from "@/components/agents/message-bubble";
import { StreamingResponse } from "@/components/agents/streaming-response";
import { TodoList, type TodoItem } from "@/components/agents/todo-list";
import {
  ToolApproval,
  ToolApprovalCode,
  type ToolApprovalStatus,
} from "@/components/agents/tool-approval";
import { ToolResult, ToolResultOutput } from "@/components/agents/tool-result";

// ==========================================
// 静态模拟演示数据
// ==========================================

/** 代码变更 Diff 演示行数据 */
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

/** 终态决策审批卡片问题配置 */
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

/** 生成完成确认页的占位图 SVG 预览 */
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

/**
 * AuditTimeline 组件的入参属性定义
 */
export interface AuditTimelineProps {
  /** 任务计划清单 (TodoList) 列表项 */
  plan: TodoItem[];
  /** 工具调用审批与执行状态 */
  toolStatus: ToolApprovalStatus;
  /** 终态决策审批卡片状态 */
  approvalStatus: ApprovalCardStatus;
  /** 批准工具执行的回调 */
  onApproveTool: () => void;
  /** 拒绝工具执行的回调 */
  onDenyTool: () => void;
  /** 提交决策审批表单的回调 */
  onSubmitApproval: () => void;
}

/**
 * 【组件: AuditTimeline】
 * 作用：展示“结算流程审计与补丁修复”这条完整业务工作流的模拟时间线。
 *
 * 包含的阶段节点：
 * 1. 用户原始需求提问
 * 2. 智能体活动轨迹 (AgentActivity) 与执行计划 (TodoList)
 * 3. 工具审批卡片 (ToolApproval, 如允许运行单元测试)
 * 4. 工具执行结果 (ToolResult) 及产出的 Diff 代码比对与新模块代码 (FileDiff / CodeBlock)
 * 5. 图像生成产物与结果总结
 * 6. 人机协同发布决策审批卡片 (ApprovalCard)
 */
export function AuditTimeline({
  plan,
  toolStatus,
  approvalStatus,
  onApproveTool,
  onDenyTool,
  onSubmitApproval,
}: AuditTimelineProps) {
  return (
    <>
      {/* 1. 初始用户提问 */}
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

      {/* 2. 智能体活动轨迹 & 动态计划清单 */}
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

      {/* 3. 工具执行审批卡片 (ToolApproval) */}
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
                value: <ToolApprovalCode code="bun test checkout --coverage" language="bash" />,
              },
              { id: "scope", label: "运行作用域", value: "当前工作区" },
            ]}
            onApprove={onApproveTool}
            onAlwaysAllow={onApproveTool}
            onDeny={onDenyTool}
          />
        </MessageContent>
      </Message>

      {/* 4. 工具执行结果展示（根据 toolStatus 动态渲染） */}
      {toolStatus === "running" || toolStatus === "complete" ? (
        <Message from="assistant" animateIn>
          <MessageAvatar placeholder />
          <MessageContent className="gap-3">
            <ToolResult
              tool="terminal.run"
              title={toolStatus === "running" ? "正在运行结算检查..." : "结算自动化检查全部通过"}
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

      {/* 5. 图像生成与流式总结 */}
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

      {/* 6. 人机协同最终审批决策卡片 */}
      {toolStatus === "complete" ? (
        <Message from="assistant" animateIn>
          <MessageAvatar placeholder />
          <MessageContent>
            <ApprovalCard
              questions={approvalQuestions}
              status={approvalStatus}
              onSubmit={onSubmitApproval}
              result="发布决策指令已发送给智能体。"
            />
          </MessageContent>
        </Message>
      ) : null}
    </>
  );
}
