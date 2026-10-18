import { SPRING_PRESS } from "@frontend/lib/ease";
import { useHoverCapable } from "@frontend/lib/hooks/use-hover-capable";
import { cn } from "@frontend/lib/utils";
import { motion, useReducedMotion } from "motion/react";

export interface NotFoundProps {
  className?: string;
  /** The big status code. */
  code?: string;
  title?: string;
  description?: string;
  homeHref?: string;
  homeLabel?: string;
  browseHref?: string;
  browseLabel?: string;
}

export const NOT_FOUND_DEFAULTS = {
  code: "404",
  title: "Page not found",
  description: "",
  homeHref: "/",
  homeLabel: "回到首页",
  browseHref: "https://github.com/dandelion-promise520/study-langgraph",
  browseLabel: "查看github仓库",
} as const;

type ActionsProps = Pick<
  NotFoundProps,
  "homeHref" | "homeLabel" | "browseHref" | "browseLabel" | "className"
>;

/** The shared dual CTA: a primary "Back home" and a secondary "Browse". */
export function NotFoundActions({
  homeHref = NOT_FOUND_DEFAULTS.homeHref,
  homeLabel = NOT_FOUND_DEFAULTS.homeLabel,
  browseHref = NOT_FOUND_DEFAULTS.browseHref,
  browseLabel = NOT_FOUND_DEFAULTS.browseLabel,
  className,
}: ActionsProps) {
  const reduce = useReducedMotion();
  const canHover = useHoverCapable();
  const whileTap = reduce ? undefined : { scale: 0.96 };
  const whileHover = reduce || !canHover ? undefined : { scale: 1.02 };

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-3", className)}>
      <motion.a
        href={homeHref}
        whileTap={whileTap}
        whileHover={whileHover}
        transition={SPRING_PRESS}
        className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors select-none hover:bg-primary/90"
      >
        {homeLabel}
      </motion.a>
      <motion.a
        href={browseHref}
        whileTap={whileTap}
        whileHover={whileHover}
        transition={SPRING_PRESS}
        className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-card px-6 text-sm font-medium text-foreground transition-colors select-none hover:bg-muted/60"
      >
        {browseLabel}
      </motion.a>
    </div>
  );
}

/** Centers a variant and gives it a consistent minimum stage height. */
export function NotFoundStage({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-h-105 w-full flex-col items-center justify-center gap-8 px-4 text-center",
        className,
      )}
    >
      {children}
    </div>
  );
}
