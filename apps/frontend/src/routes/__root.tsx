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
import {
  AnimatedToastStack,
  useAnimatedToastStack,
  type ToastInput,
} from "@frontend/components/motion/animated-toast-stack";
import { NotFoundGlitch } from "@frontend/components/motion/not-found/glitch";
import { useThreads } from "@frontend/hooks";
import {
  createRootRouteWithContext,
  Outlet,
  useMatchRoute,
  useNavigate,
} from "@tanstack/react-router";
import { MessageCircle, MessageSquarePlus, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

const RootComponent = () => {
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

  const { toasts, showToast, updateToast, dismissToast } = useAnimatedToastStack({
    defaultDuration: 3600,
    limit: 5,
  });

  const openToast = (input: ToastInput) => {
    const id = showToast(input);
    if (input.status === "loading") {
      window.setTimeout(() => {
        updateToast(id, {
          status: "success",
          title: "Publish complete",
          description: "Toast updated in-place from loading to success.",
          duration: 3200,
        });
      }, 1800);
    }
  };

  // 打开删除会话模态框，并传入deleteItem信息
  const handleDeleteSession = async (item: SidebarResource) => {
    console.log(item);
    setDeleteItem(item);
    setModalOpen(true);
  };

  // 确认删除
  const handleConfirmDelete = async (item: SidebarResource) => {
    try {
      // 给按钮打上loading
      setDeleteState("loading");
      // 等待请求完成
      await deleteThread(item.id);
      // 如果删的是当前的激活会话，就跳转到跟目录
      if (deleteItem && activeThreadId === deleteItem.id) {
        navigate({ to: "/" });
      }
      // 弹个窗显示删除成功
      openToast({ title: "删除会话成功", status: "success" });
    } catch {
      openToast({ title: "删除会话失败", status: "error" });
    } finally {
      // 不管成功或是失败，都统一关掉模态框并清除传入的item信息并让删除按钮恢复原态
      setDeleteState("idle");
      setModalOpen(false);
      setDeleteItem(null);
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
                    icon={<MessageSquarePlus className="size-3.5" />}
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
                renderIcon={() => <MessageCircle className="size-3.5" />}
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
          if (!open) setModalOpen(false);
          else setModalOpen(true);
        }}
      >
        <CenterMorphModalContent ariaLabel="删除聊天?">
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
                    setModalOpen(false);
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
                  errorText="请重试"
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

      {/* 全局弹窗 */}
      <AnimatedToastStack
        toasts={toasts}
        onDismiss={dismissToast}
        position={"top-center"}
        placement="fixed"
        maxVisible={4}
        classNames={{
          surface: "bg-card/95",
        }}
        icons={{
          neutral: <Sparkles className="size-3.5" />,
        }}
      />
    </ChatApp>
  );
};

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
  notFoundComponent: () => <NotFoundGlitch />,
});
