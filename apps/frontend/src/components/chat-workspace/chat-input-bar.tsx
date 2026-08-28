import { FolderKanban, Paperclip, WandSparkles } from "lucide-react";

import { PromptInput } from "@/components/agents/prompt-input";

/**
 * ChatInputBar 组件的入参属性定义
 */
export interface ChatInputBarProps {
  /** 当前输入框文本值 */
  value: string;
  /** 是否处于忙碌/生成中状态（为 true 时发送按钮变为停止按钮） */
  loading: boolean;
  /** 输入文本变更回调 */
  onValueChange: (value: string) => void;
  /** 提交消息回调 */
  onSubmit: (value: string) => void;
  /** 停止/打断生成回调 */
  onStop: () => void;
}

/**
 * 【组件: ChatInputBar】
 * 作用：工作区底部的 Prompt 提示词输入区域。
 *
 * 包含：
 * 1. 自动扩展的多行输入框（支持 Enter 快捷发送，Shift+Enter 换行）
 * 2. 模型档位切换菜单（标准均衡 / 极速响应 / 深度思考）
 * 3. 附件与功能扩展动作按钮（上传附件、关联项目上下文、调用技能库）
 * 4. 正在生成时的停止打断按钮支持
 */
export function ChatInputBar({
  value,
  loading,
  onValueChange,
  onSubmit,
  onStop,
}: ChatInputBarProps) {
  return (
    <div className="shrink-0 border-t border-border bg-background p-3">
      <div className="mx-auto max-w-3xl">
        <PromptInput
          value={value}
          onValueChange={onValueChange}
          loading={loading}
          onStop={onStop}
          onSubmit={onSubmit}
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
  );
}
