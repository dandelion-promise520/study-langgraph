import type { MyRouterContext } from "@frontend/router";

import { AISidebar, ChatApp, type SidebarResource } from "@frontend/components/agents";
import {
  AnimatedSidebar,
  AnimatedSidebarContent,
  AnimatedSidebarGroup,
  AnimatedSidebarGroupContent,
  AnimatedSidebarGroupLabel,
  AnimatedSidebarMenu,
  AnimatedSidebarMenuButton,
  AnimatedSidebarMenuItem,
  Button,
  CenterMorphModal,
  CenterMorphModalContent,
  StatefulButton,
  type ButtonState,
} from "@frontend/components/motion";
import { useThreads } from "@frontend/hooks";
import {
  createRootRouteWithContext,
  Outlet,
  useMatchRoute,
  useNavigate,
} from "@tanstack/react-router";
import { MessageCircle, MessageSquarePlus } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  const navigate = useNavigate();
  const matchRoute = useMatchRoute();
  const match = matchRoute({ to: "/c/$threadId" });

  // 服务端会话列表与变更 Hook
  const { threads, renameThread, deleteThread } = useThreads();

  // 格式化给侧边栏
  const sessions: SidebarResource[] = useMemo(
    () =>
      threads.map((t) => ({
        id: t.id,
        label: t.title,
        kind: "file" as const,
      })),
    [threads],
  );

  // 当前激活会话
  const activeThreadId = match ? match.threadId : null;

  // 新建会话直接跳转到根路径
  const handleNewSession = () => {
    navigate({ to: "/" });
  };

  // 重命名会话
  const handleRenameSession = async (item: SidebarResource, nextLabel: string) => {
    const trimmed = nextLabel.trim();
    if (!trimmed || trimmed === item.label) return;
    try {
      await renameThread({ id: item.id, body: { title: trimmed } });
    } catch (error) {
      console.error("重命名会话失败:", error);
    }
  };

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [deleteState, setDeleteState] = useState<ButtonState>("idle");
  const [deleteItem, setDeleteItem] = useState<SidebarResource | null>(null);

  // 打开删除会话模态框，并deleteItem信息
  const handleDeleteSession = async (item: SidebarResource) => {
    setDeleteItem(item);
    setModalOpen(true);
  };

  // 抽离一个通用的安全关窗与重置函数
  const handleCloseModal = () => {
    setModalOpen(false);
  };

  // 确认删除
  const handleConfirmDelete = async (item: SidebarResource) => {
    try {
      setDeleteState("loading");
      await deleteThread(item.id);
      setDeleteState("success");

      // 保留一个短暂的视觉停留
      setTimeout(() => {
        handleCloseModal();
      }, 500);
    } catch (error) {
      setDeleteState("error");
      console.error("删除会话失败", error);
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
                renderIcon={() => <MessageCircle className="size-4" />}
                onDelete={handleDeleteSession}
                onActiveChange={(id) => {
                  if (id) {
                    navigate({ to: "/c/$threadId", params: { threadId: id } });
                  }
                }}
                onRename={handleRenameSession}
              />
            </AnimatedSidebarGroupContent>
          </AnimatedSidebarGroup>
        </AnimatedSidebarContent>
      </AnimatedSidebar>

      {/* 右侧主视窗 */}
      <Outlet />

      {/* 二次确认模态框 */}
      <CenterMorphModal
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseModal();
          else setModalOpen(true);
        }}
      >
        <CenterMorphModalContent
          ariaLabel="删除聊天?"
          onExitComplete={() => {
            // 弹窗动画结束后触发
            setDeleteState("idle");
            if (deleteItem && activeThreadId === deleteItem.id) {
              navigate({ to: "/" });
            }
            setDeleteItem(null);
          }}
        >
          <div className="flex flex-col gap-4 p-7 sm:p-8">
            {/* 标题 */}
            <p className="text-xl">删除聊天?</p>
            <div className="flex flex-col gap-4">
              {/* 主区域 */}
              <div className="flex">
                <span className="text-md tracking-tight text-foreground">这会删除</span>
                <span className="font-bold">"{deleteItem?.label}"</span>
              </div>

              {/* 按钮组 */}
              <div className="flex gap-4 self-end">
                <Button
                  className="cursor-pointer"
                  variant="outline"
                  size="md"
                  onClick={() => {
                    handleCloseModal();
                  }}
                >
                  取消
                </Button>
                <StatefulButton
                  className="cursor-pointer bg-destructive hover:bg-destructive/90"
                  state={deleteState}
                  variant="primary"
                  size="md"
                  onClick={() => {
                    if (!deleteItem) return;
                    handleConfirmDelete(deleteItem);
                  }}
                  loadingText="删除中"
                  successText="删除完成"
                >
                  删除
                </StatefulButton>
              </div>
            </div>
          </div>
        </CenterMorphModalContent>
      </CenterMorphModal>
    </ChatApp>
  );
}
