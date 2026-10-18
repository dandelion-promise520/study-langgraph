/**
 * beUI vendor 层（motion）集中导出
 *
 * 本目录是 registry 源码的落地位置，每个文件的路径与 @beui registry item 声明的
 * target 一一对应，台账见 registry.manifest.json。因此：
 *   - 升级请用 `bunx --bun shadcn@latest add @beui/<slug> --diff <file>`，不要手写上游逻辑；
 *   - 不要把本目录的文件搬到业务目录，否则 CLI 的 --diff/--overwrite 会失去参照；
 *   - 本文件（index.ts）是本目录唯一的自有文件，registry 不会覆盖它。
 *
 * 结构约束由 `bun run check:vendor` 校验。
 */
export * from "@frontend/lib/presence-gate";
export * from "./action-swap";
export * from "./action-swap-roll";
export * from "./animated-sidebar";
export * from "./button";
export * from "./center-morph-modal";
export * from "./checkbox";
export * from "./input";
export * from "./loader";
export * from "./magnetic";
export * from "./popover-morph";
export * from "./popover-position";
export * from "./radio";
export * from "./select";
export * from "./shared-layout-bg";
export * from "./text-scramble";
export * from "./text-shimmer";
