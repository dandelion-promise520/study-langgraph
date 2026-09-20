import { MessageSquarePlus } from "lucide-react";
import { useMemo, useState } from "react";

import { AISidebar, type SidebarResource } from "./components/agents/ai-sidebar";
import { ChatApp } from "./components/agents/chat-app";
import { ChatPane } from "./components/chat-pane";
import {
  AnimatedSidebar,
  AnimatedSidebarContent,
  AnimatedSidebarGroup,
  AnimatedSidebarGroupContent,
  AnimatedSidebarGroupLabel,
  AnimatedSidebarMenu,
  AnimatedSidebarMenuButton,
  AnimatedSidebarMenuItem,
} from "./components/motion/animated-sidebar";
import { useThreads } from "./hooks/thread";

export const App = () => {
  // 1. 服务端会话列表与变更 Hook
  const { threads, createThread, renameThread } = useThreads();

  // 2. 选中的会话 ID
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  // 3. 格式化给侧边栏
  const sessions: SidebarResource[] = useMemo(
    () =>
      threads.map((t) => ({
        id: t.id,
        label: t.title,
        kind: "file" as const,
      })),
    [threads],
  );

  // 4. 当前生效的会话（派生值）
  const activeThreadId =
    selectedThreadId && threads.some((t) => t.id === selectedThreadId)
      ? selectedThreadId
      : (threads[0]?.id ?? null);

  const activeSession = sessions.find((s) => s.id === activeThreadId);

  // 5. 新建与重命名交互
  const handleNewSession = async () => {
    try {
      const newThread = await createThread();
      setSelectedThreadId(newThread.id);
    } catch (error) {
      console.error("新建会话失败:", error);
    }
  };

  const handleRenameSession = async (item: SidebarResource, nextLabel: string) => {
    const trimmed = nextLabel.trim();
    if (!trimmed || trimmed === item.label) return;
    try {
      await renameThread({ id: item.id, body: { title: trimmed } });
    } catch (error) {
      console.error("重命名会话失败:", error);
    }
  };

  return (
    <ChatApp sidebarWidth="16rem" className="h-dvh w-full rounded-none border-0">
      {/* 左侧边栏 */}
      <AnimatedSidebar collapsible="offcanvas">
        <AnimatedSidebarContent>
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

          <AnimatedSidebarGroup>
            <AnimatedSidebarGroupLabel>历史会话</AnimatedSidebarGroupLabel>
            <AnimatedSidebarGroupContent>
              <AISidebar
                activeId={activeThreadId}
                items={sessions}
                onActiveChange={setSelectedThreadId}
                onRename={handleRenameSession}
              />
            </AnimatedSidebarGroupContent>
          </AnimatedSidebarGroup>
        </AnimatedSidebarContent>
      </AnimatedSidebar>

      {/* 右侧主视窗：在这里做全局唯一的一次守卫拦截！ */}
      {activeThreadId ? (
        // 给 key={activeThreadId}：切换会话时 React 会自动重置内部状态，极其省心
        <ChatPane
          key={activeThreadId}
          threadId={activeThreadId}
          threadTitle={activeSession?.label}
        />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
          <p className="text-sm">暂无活跃会话</p>
          <button
            onClick={handleNewSession}
            className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
          >
            立即创建新会话
          </button>
        </div>
      )}
    </ChatApp>
  );
};
