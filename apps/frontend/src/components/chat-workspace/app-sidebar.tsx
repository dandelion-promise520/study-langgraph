import {
  Clock3,
  FileText,
  Home,
  MessageSquarePlus,
  Plus,
  Search,
  Settings,
  User,
} from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

import { AISidebar, type SidebarResource } from "@/components/agents/ai-sidebar";
import {
  AnimatedSidebar,
  AnimatedSidebarContent,
  AnimatedSidebarGroup,
  AnimatedSidebarGroupContent,
  AnimatedSidebarGroupLabel,
  AnimatedSidebarMenu,
  AnimatedSidebarMenuButton,
  AnimatedSidebarMenuItem,
  AnimatedSidebarRail,
} from "@/components/motion/animated-sidebar";
import { CommandPalette } from "@/components/motion/command-palette";

/**
 * AppSidebar 组件的入参属性定义
 * 
 * 学习点：组件 Props 接口化
 * 将侧边栏所需的数据 (items, activeResource, commandOpen) 与状态变更回调清晰定义，
 * 使侧边栏成为一个纯粹的可复用展示与交互组件（受控组件模式 Controlled Component）。
 */
export interface AppSidebarProps {
  /** 工作区目录树资源数据 */
  items: SidebarResource[];
  /** 当前激活的节点 ID */
  activeResource: string;
  /** 快捷指令搜索面板是否打开 */
  commandOpen: boolean;
  /** 目录树数据变更回调 */
  onItemsChange: Dispatch<SetStateAction<SidebarResource[]>>;
  /** 激活节点变更回调 */
  onActiveResourceChange: (id: string) => void;
  /** 快捷指令搜索面板显示状态变更回调 */
  onCommandOpenChange: (open: boolean) => void;
}

/**
 * 【组件: AppSidebar】
 * 作用：智能体工作区左侧导航栏。
 * 
 * 包含：
 * 1. 顶部操作菜单（新建任务、全站搜索、运行记录）
 * 2. 全局快捷指令面板（CommandPalette, 支持快捷键 Ctrl/⌘ + J）
 * 3. 项目/文件资源树（AISidebar, 支持折叠、选择与拖拽排序）
 */
export function AppSidebar({
  items,
  activeResource,
  commandOpen,
  onItemsChange,
  onActiveResourceChange,
  onCommandOpenChange,
}: AppSidebarProps) {
  return (
    <AnimatedSidebar
      ariaLabel="智能体工作区"
      collapsible="offcanvas"
      className="min-h-0"
      panelClassName="h-full bg-background"
    >
      <AnimatedSidebarContent className="gap-4 overflow-hidden px-2 py-4">
        {/* 顶部操作菜单区 */}
        <AnimatedSidebarGroup className="shrink-0 px-1 py-0">
          <AnimatedSidebarGroupContent>
            <AnimatedSidebarMenu className="gap-1">
              {[
                {
                  label: "新建任务",
                  icon: MessageSquarePlus,
                  onSelect: () => console.log("新建任务"),
                },
                {
                  label: "全站搜索",
                  icon: Search,
                  onSelect: () => onCommandOpenChange(true),
                },
                {
                  label: "运行记录",
                  icon: Clock3,
                  onSelect: () => console.log("运行记录"),
                },
              ].map(({ label, icon: Icon, onSelect }) => (
                <AnimatedSidebarMenuItem key={label}>
                  <AnimatedSidebarMenuButton
                    icon={<Icon className="size-4" />}
                    onSelect={onSelect}
                    className="font-normal"
                  >
                    {label}
                  </AnimatedSidebarMenuButton>
                </AnimatedSidebarMenuItem>
              ))}

              {/* 全局指令弹窗 */}
              <CommandPalette
                open={commandOpen}
                onOpenChange={onCommandOpenChange}
                shortcut="j"
                items={[
                  {
                    id: "home",
                    label: "Go to Home",
                    group: "Navigation",
                    icon: Home,
                    hint: "G H",
                    onSelect: () => {},
                  },
                  {
                    id: "profile",
                    label: "Open profile",
                    group: "Navigation",
                    icon: User,
                    hint: "G P",
                    onSelect: () => {},
                  },
                  {
                    id: "settings",
                    label: "Settings",
                    group: "Navigation",
                    icon: Settings,
                    onSelect: () => {},
                  },
                  {
                    id: "new-doc",
                    label: "Create document",
                    group: "Actions",
                    icon: FileText,
                    hint: "⌘ N",
                    onSelect: () => {},
                  },
                  {
                    id: "new-project",
                    label: "New project",
                    group: "Actions",
                    icon: Plus,
                    hint: "⌘ ⇧ N",
                    onSelect: () => {},
                  },
                ]}
              />
            </AnimatedSidebarMenu>
          </AnimatedSidebarGroupContent>
        </AnimatedSidebarGroup>

        {/* 下半部分：项目资源目录树 */}
        <AnimatedSidebarGroup className="min-h-0 flex-1 px-1 py-0">
          <AnimatedSidebarGroupLabel className="mb-1 h-8 px-2 text-xs font-medium tracking-normal normal-case">
            项目列表
          </AnimatedSidebarGroupLabel>
          <AnimatedSidebarGroupContent className="relative min-h-0 flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto overscroll-contain pb-8 [overflow-anchor:none] [&::-webkit-scrollbar]:hidden">
              <AISidebar
                items={items}
                activeId={activeResource}
                defaultExpandedIds={["release", "design"]}
                onActiveChange={onActiveResourceChange}
                onItemsChange={onItemsChange}
              />
            </div>
            {/* 底部渐变遮罩，提供柔和的滚动边缘体验 */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent"
            />
          </AnimatedSidebarGroupContent>
        </AnimatedSidebarGroup>
      </AnimatedSidebarContent>
      <AnimatedSidebarRail />
    </AnimatedSidebar>
  );
}
