import {
  Button,
  CenterMorphModal,
  CenterMorphModalContent,
  StatefulButton,
  type ButtonState,
} from "@frontend/components/motion";

import type { SidebarResource } from "./ai-sidebar";

interface DeleteChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deleteItem: SidebarResource | null;
  deleteState: ButtonState;
  handleConfirmDelete: (item: SidebarResource) => Promise<void>;
}

export const DeleteChatModal = ({
  open,
  onOpenChange,
  deleteItem,
  deleteState,
  handleConfirmDelete,
}: DeleteChatModalProps) => {
  return (
    <CenterMorphModal open={open} onOpenChange={onOpenChange}>
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
                  onOpenChange(false);
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
  );
};
