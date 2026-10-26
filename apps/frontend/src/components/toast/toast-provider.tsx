import {
  AnimatedToastStack,
  useAnimatedToastStack,
} from "@frontend/vendor/motion/animated-toast-stack";
import { createContext, useContext, type ReactNode } from "react";

const ToastCtx = createContext<ReturnType<typeof useAnimatedToastStack> | null>(null);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const stack = useAnimatedToastStack({ defaultDuration: 3600, limit: 5 });

  return (
    <ToastCtx.Provider value={stack}>
      {children}
      {/* 全局弹窗 */}
      <AnimatedToastStack
        toasts={stack.toasts}
        onDismiss={stack.dismissToast}
        position={"top-center"}
        placement="fixed"
        maxVisible={4}
        classNames={{
          surface: "bg-card/95",
        }}
      />
    </ToastCtx.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast必须在ToastProvider中使用");
  return ctx;
};
