import { defineConfig } from "cz-git";
import { execSync } from "node:child_process";
import fs from "node:fs";

/**
 * 1. 动态获取 Monorepo 所有子包名
 * 优先使用 Bun.Glob 高性能扫描，降级使用 node:fs
 */
function getWorkspacePackages() {
  if (typeof Bun !== "undefined") {
    try {
      const glob = new Bun.Glob("{apps,packages}/*");
      const pkgs = new Set();
      for (const item of glob.scanSync({ onlyFiles: false })) {
        const normalized = item.replace(/\\/g, "/");
        const parts = normalized.split("/");
        if (parts.length >= 2 && !parts[1].startsWith(".")) {
          pkgs.add(parts[1]);
        }
      }
      return Array.from(pkgs);
    } catch {
      // 忽略异常，降级到通用方式
    }
  }

  const dirs = ["apps", "packages"];
  const pkgs = new Set();
  for (const dir of dirs) {
    if (fs.existsSync(dir)) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory() && !entry.name.startsWith(".")) {
          pkgs.add(entry.name);
        }
      }
    }
  }
  return Array.from(pkgs);
}

const workspacePackages = getWorkspacePackages();
const baseScopes = ["root", "agent", "ui", "motion", "config", "deps"];
const allScopes = Array.from(new Set([...baseScopes, ...workspacePackages]));

/**
 * 2. 获取暂存区或工作区变更文件列表
 */
function getChangedFiles() {
  try {
    let output = execSync("git diff --cached --name-only", { encoding: "utf8" }).trim();
    if (!output) {
      output = execSync("git diff --name-only", { encoding: "utf8" }).trim();
    }
    return output ? output.split(/\r?\n/).filter(Boolean) : [];
  } catch {
    return [];
  }
}

/**
 * 3. 分层动态推断 scope
 */
function getDynamicScope() {
  const files = getChangedFiles();
  if (files.length === 0) return "";

  // 依赖变更 (deps)
  if (files.every((f) => f === "bun.lock" || f.endsWith("/package.json") || f === "package.json")) {
    if (files.some((f) => f.includes("lock"))) return "deps";
  }

  // 工程与工具链配置 (config)
  const configFiles = [
    "commitlint.config.mjs",
    ".lintstagedrc.json",
    ".oxfmtrc.json",
    ".oxlintrc.json",
    "tsconfig.json",
    "tsconfig.base.json",
  ];
  if (
    files.every(
      (f) => configFiles.includes(f) || f.startsWith(".husky/") || f.startsWith(".vscode/"),
    )
  ) {
    return "config";
  }

  // 核心智能体模块 (agent)
  if (files.every((f) => f.startsWith("apps/backend/src/agent/"))) {
    return "agent";
  }

  // 前端交互动画 (motion)
  if (
    files.every(
      (f) => f.startsWith("apps/frontend/") && (f.includes("/motion/") || f.includes("motion")),
    )
  ) {
    return "motion";
  }

  // 前端公共 UI (ui)
  if (files.every((f) => f.startsWith("apps/frontend/src/components/ui/"))) {
    return "ui";
  }

  // 动态包匹配：改动集中在某个子包中
  for (const pkg of workspacePackages) {
    if (files.every((f) => f.startsWith(`apps/${pkg}/`) || f.startsWith(`packages/${pkg}/`))) {
      return pkg;
    }
  }

  // 根目录杂项与文档 (root)
  if (files.every((f) => !f.includes("/") || f.startsWith("docs/"))) {
    return "root";
  }

  return "";
}

export default defineConfig({
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [2, "always", allScopes],
    "scope-empty": [0, "always"],
  },
  prompt: {
    defaultScope: getDynamicScope(),
    // 中文交互界面
    messages: {
      type: "选择你要提交的更改类型:",
      scope: "选择更改影响的范围（与 scope-enum 保持一致）:",
      customScope: "请输入自定义的 scope:",
      subject: "填写简短精炼的变更描述（祈使句，小写开头）:",
      body: '填写更加详细的变更描述（可选）。使用 "|" 换行:',
      breaking: '列举非兼容性重大变更（可选）。使用 "|" 换行:',
      footerPrefixesSelect: "选择关联 issue 前缀（可选）:",
      customFooterPrefix: "输入自定义 issue 前缀:",
      footer: "列举此更改关联的 issue（可选）。例如: #31, #34:",
      confirmCommit: "确认提交?",
      generatingByAI: "AI 正在生成提交标题...",
      generatedSelectByAI: "从 AI 生成的候选中选择合适的标题:",
    },
    // 自定义发送给 AI 的提示词（cz-git 默认用英文 prompt，所以这里强制要求输出简体中文）
    aiQuestionCB: ({ maxSubjectLength, diff }) =>
      [
        "你是一名资深工程师，正在编写遵循 Conventional Commits 规范的 Git 提交信息。",
        "请阅读下面的 git diff，生成一句简体中文的提交标题（subject），要求：",
        "1. 以动词开头，简明扼要概括本次改动，避免空话套话；",
        "2. 只输出 subject 本身：不要带 type/scope 前缀，不要引号，不要以句号结尾；",
        `3. 长度不要超过 ${maxSubjectLength} 个字符。`,
        "",
        "以下是代码 diff：",
        diff,
      ].join("\n"),
    // scope 未显式配置时，cz-git 会自动读取上方 commitlint 的 scope-enum 规则生成候选列表
    useEmoji: false,
    allowCustomScopes: false,
    allowBreakingChanges: ["feat", "fix"],
    types: [
      { value: "feat", name: "feat:     ✨ 新特性", emoji: "✨" },
      { value: "fix", name: "fix:      🐛 修复缺陷", emoji: "🐛" },
      { value: "docs", name: "docs:     📚 文档更新", emoji: "📚" },
      { value: "style", name: "style:    💎 代码格式", emoji: "💎" },
      { value: "refactor", name: "refactor: 📦 代码重构", emoji: "📦" },
      { value: "perf", name: "perf:     🚀 性能优化", emoji: "🚀" },
      { value: "test", name: "test:     🚨 自动化测试", emoji: "🚨" },
      { value: "build", name: "build:    🛠️ 构建与依赖", emoji: "🛠️" },
      { value: "ci", name: "ci:       ⚙️ 持续集成", emoji: "⚙️" },
      { value: "chore", name: "chore:    ♻️ 日常维护", emoji: "♻️" },
      { value: "revert", name: "revert:   🗑️ 回滚提交", emoji: "🗑️" },
    ],
  },
});
