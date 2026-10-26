import type { MyRouterContext } from "@frontend/router";

import { AuthModal } from "@frontend/components/auth";
import { DeleteChatModal } from "@frontend/components/chat/workspace/delete-chat-modal";
import { NotFoundGlitch } from "@frontend/components/not-found";
import { useToast } from "@frontend/components/toast";
import { useAuth, useThreads } from "@frontend/hooks";
import { AISidebar, type SidebarResource } from "@frontend/vendor/agents/ai-sidebar";
import { ChatApp } from "@frontend/vendor/agents/chat-app";
import {
  AnimatedSidebar,
  AnimatedSidebarContent,
  AnimatedSidebarFooter,
  AnimatedSidebarGroupLabel,
  AnimatedSidebarHeader,
  AnimatedSidebarMenu,
  AnimatedSidebarMenuButton,
  AnimatedSidebarMenuItem,
  Button,
  type ButtonState,
} from "@frontend/vendor/motion";
import { Avatar, AvatarFallback, AvatarImage } from "@frontend/vendor/ui/avatar";
import {
  createRootRouteWithContext,
  Outlet,
  useMatchRoute,
  useNavigate,
} from "@tanstack/react-router";
import { MessageCircle, MessageSquarePlus, UserRound } from "lucide-react";
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

  const { showToast } = useToast();

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
      showToast({ title: "删除会话成功", status: "success" });
    } catch {
      showToast({ title: "删除会话失败", status: "error" });
    } finally {
      // 不管成功或是失败，都统一关掉模态框并清除传入的item信息并让删除按钮恢复原态
      setDeleteState("idle");
      setModalOpen(false);
      setDeleteItem(null);
    }
  };

  const { data, isAuthenticated } = useAuth();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  return (
    <ChatApp sidebarWidth="16rem" className="h-dvh w-full rounded-none border-0">
      {/* 左侧边栏 */}
      <AnimatedSidebar collapsible="offcanvas">
        {/* 头部 */}
        <AnimatedSidebarHeader>
          <AnimatedSidebarMenu>
            <AnimatedSidebarMenuItem>
              <AnimatedSidebarMenuButton
                icon={<MessageSquarePlus />}
                onSelect={handleNewSession}
                className="font-normal"
              >
                新建会话
              </AnimatedSidebarMenuButton>
            </AnimatedSidebarMenuItem>
          </AnimatedSidebarMenu>
        </AnimatedSidebarHeader>
        {/* 左上角按钮组 */}
        <AnimatedSidebarContent>
          {/* 会话内容部分 */}
          <AnimatedSidebarGroupLabel>历史会话</AnimatedSidebarGroupLabel>
          <AISidebar
            activeId={activeThreadId}
            items={sessions}
            renderIcon={() => <MessageCircle />}
            onDelete={handleDeleteSession}
            onActiveChange={(id) => {
              if (id) {
                navigate({ to: "/c/$threadId", params: { threadId: id } });
              }
            }}
            onRename={handleRenameSession}
          />
        </AnimatedSidebarContent>

        {/* 左下角登录处 */}
        <AnimatedSidebarFooter>
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={"https://assets.watermelon.sh/wm_alex.png"} alt={data?.name} />
                <AvatarFallback className="text-xs">{data?.name}</AvatarFallback>
              </Avatar>
              <span>{data?.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-3.5">
              <Avatar className="flex items-center justify-center">
                <UserRound />
              </Avatar>
              <Button
                className="cursor-pointer"
                size="sm"
                onClick={() => {
                  setIsLoginModalOpen(true);
                }}
              >
                登录
              </Button>
            </div>
          )}
        </AnimatedSidebarFooter>
      </AnimatedSidebar>

      {/* 右侧主视窗 */}
      <Outlet />

      {/* 删除弹框 */}
      <DeleteChatModal
        deleteItem={deleteItem}
        deleteState={deleteState}
        handleConfirmDelete={handleConfirmDelete}
        onOpenChange={setModalOpen}
        open={modalOpen}
      />

      {/* 注册与登录弹框 */}
      <AuthModal
        open={isLoginModalOpen}
        onOpenChange={(open) => {
          if (!open) setIsLoginModalOpen(false);
          else setIsLoginModalOpen(true);
        }}
      />
    </ChatApp>
  );
};

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
  notFoundComponent: () => <NotFoundGlitch />,
});
