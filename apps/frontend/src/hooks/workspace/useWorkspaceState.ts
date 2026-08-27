import { useState } from "react";

import type { SidebarResource } from "@/components/agents/ai-sidebar";

/**
 * 【Hook: useWorkspaceState】
 * 作用：管理工作区侧边栏的项目资源树结构、当前激活文件以及全局快捷指令弹窗（CommandPalette）。
 * 
 * 包含的职责：
 * 1. items：侧边栏工作区文件/项目树形结构数据，支持用户拖拽或增删修改
 * 2. activeResource：当前正在浏览或激活的项目/文件节点 ID
 * 3. commandOpen：快捷指令弹窗 (⌘J / Ctrl+J) 的显示/隐藏控制
 * 
 * @param initialResources 初始资源列表配置
 * @param defaultActive 默认激活的项目/文件 ID，默认 "checkout"
 */
export function useWorkspaceState(
  initialResources: SidebarResource[],
  defaultActive = "checkout",
) {
  // 工作区资源目录树数据
  const [items, setItems] = useState<SidebarResource[]>(initialResources);

  // 当前选中的资源 ID
  const [activeResource, setActiveResource] = useState<string>(defaultActive);

  // 全局命令面板（CommandPalette）的开关状态
  const [commandOpen, setCommandOpen] = useState(false);

  return {
    items,
    setItems,
    activeResource,
    setActiveResource,
    commandOpen,
    setCommandOpen,
  };
}
