import { PanelLeft } from "lucide-react";

import { AnimatedSidebarTrigger } from "@/components/motion/animated-sidebar";
import { ThemeToggle } from "@/components/motion/theme-toggle";

/**
 * AppHeader 组件的入参属性定义
 */
export interface AppHeaderProps {
  /** 头部主标题，默认为 "结算模块发布" */
  title?: string;
  /** 头部副标题，默认为 "智能体工作区 · 定向修复补丁" */
  subtitle?: string;
}

/**
 * 【组件: AppHeader】
 * 作用：工作区主体区域顶部导航栏。
 * 
 * 包含：
 * 1. 侧边栏折叠/展开触发器按钮 (AnimatedSidebarTrigger)
 * 2. 当前会话/任务的标题与副标题
 * 3. 明暗主题切换开关 (ThemeToggle)
 */
export function AppHeader({
  title = "结算模块发布",
  subtitle = "智能体工作区 · 定向修复补丁",
}: AppHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
      {/* 左侧：侧边栏切换按钮 + 标题描述 */}
      <div className="flex min-w-0 items-center gap-2.5">
        <AnimatedSidebarTrigger className="text-muted-foreground hover:bg-muted hover:text-foreground">
          <PanelLeft className="size-4" />
        </AnimatedSidebarTrigger>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{title}</p>
          <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      {/* 右侧：主题切换按钮 */}
      <div className="flex items-center gap-2">
        <ThemeToggle
          variant="rectangle"
          start="bottom-up"
          className="rounded-xl border border-border bg-background p-2.5"
          iconClassName="h-5 w-5"
        />
      </div>
    </header>
  );
}
