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
    let output = execSync("git diff --cached --name-only", {
      encoding: "utf8",
    }).trim();
    if (!output) {
      output = execSync("git diff --name-only", { encoding: "utf8" }).trim();
    }
    return output
      ? output
          .split(/\r?\n/)
          .filter(Boolean)
          .map((f) => f.replace(/\\/g, "/"))
      : [];
  } catch {
    return [];
  }
}

/**
 * 3. 推断单文件所属 Scope
 */
function inferScopeForFile(file) {
  // 核心智能体模块 (agent)
  if (
    file.startsWith("apps/backend/src/modules/agent/") ||
    file.startsWith("apps/backend/src/agent/")
  ) {
    return "agent";
  }

  // 前端交互动画 (motion)
  if (
    file.startsWith("apps/frontend/") &&
    (file.includes("/motion/") || file.includes("motion"))
  ) {
    return "motion";
  }

  // 前端公共 UI (ui)
  if (file.startsWith("apps/frontend/src/components/ui/")) {
    return "ui";
  }

  // 子包匹配 (backend, frontend, types 等)
  for (const pkg of workspacePackages) {
    if (
      file.startsWith(`apps/${pkg}/`) ||
      file.startsWith(`packages/${pkg}/`)
    ) {
      return pkg;
    }
  }

  // 依赖变更 (deps)
  if (
    file === "bun.lock" ||
    file.endsWith("/package.json") ||
    file === "package.json"
  ) {
    return "deps";
  }

  // 工程与工具链配置 (config)
  const configFiles = [
    "commitlint.config.mjs",
    ".lintstagedrc.json",
    ".oxfmtrc.json",
    ".oxlintrc.json",
    "tsconfig.json",
    "tsconfig.base.json",
    "cspell.json",
  ];
  if (
    configFiles.includes(file) ||
    file.startsWith(".husky/") ||
    file.startsWith(".vscode/") ||
    file.startsWith(".cspell/")
  ) {
    return "config";
  }

  // 根目录杂项与文档 (root)
  if (!file.includes("/") || file.startsWith("docs/")) {
    return "root";
  }

  return "";
}

/**
 * 4. 分层动态推断 multi-scope 列表
 */
function getDynamicScope() {
  const files = getChangedFiles();
  if (files.length === 0) return [];

  // 排除通常随代码变动附带的辅助文件（如拼写检查本地词库、IDE 临时设置）
  const noisePatterns = [/^\.cspell\//, /^\.vscode\//];
  const significantFiles = files.filter(
    (f) => !noisePatterns.some((pattern) => pattern.test(f)),
  );
  const targetFiles = significantFiles.length > 0 ? significantFiles : files;

  const detected = new Set();
  for (const file of targetFiles) {
    const s = inferScopeForFile(file);
    if (s && allScopes.includes(s)) {
      detected.add(s);
    }
  }

  const detectedScopes = Array.from(detected);
  if (detectedScopes.length === 0) return [];

  // 区分业务/模块 Scope 与底层设施 Scope (deps/config/root)
  const businessScopes = new Set([
    ...workspacePackages,
    "agent",
    "ui",
    "motion",
  ]);
  const matchedBusiness = detectedScopes.filter((s) => businessScopes.has(s));

  // 如果改动涉及具体业务/模块，优先以业务模块为准（避免因修改配置或依赖带上干扰项）
  const finalScopes =
    matchedBusiness.length > 0 ? matchedBusiness : detectedScopes;

  // cz-git / czg 在 AI 模式 (czg ai / bun run commit:ai) 下跳过了 Scope 交互提问，
  // 并且源码内部硬编码了 if (isString(options.defaultScope)) answers.scope = options.defaultScope;
  // 若传入 Array 会被 czg ai 静默丢弃导致 scope 为空。
  // 因此：在 AI 模式下返回逗号分隔的字符串（如 "backend,types"），常规交互模式下返回数组供复选框预选。
  const isAiMode =
    process.env.czai === "1" ||
    process.argv.includes("ai") ||
    process.env.npm_lifecycle_event === "commit:ai";

  if (isAiMode) {
    return finalScopes.join(",");
  }

  return finalScopes;
}

export default defineConfig({
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [2, "always", allScopes],
    "scope-empty": [0, "always"],
  },
  prompt: {
    enableMultipleScopes: true,
    scopeEnumSeparator: ",",
    defaultScope: getDynamicScope(),
    // 中文交互界面
    messages: {
      type: "选择你要提交的更改类型:",
      scope: "选择更改影响的范围（多选，按空格键选择，回车确认）:",
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
    // 忽略无关锁文件与构建产物，避免挤占 7800 字符 diff 空间
    aiDiffIgnore: ["bun.lock", "*.lock", "*.log", "dist/**"],
    // 降低发散度，提高代码摘要准确性（cz-git 默认 temperature 为 0.7）
    apiExtraBody: {
      temperature: 0.2,
    },
    // 自定义发送给 AI 的提示词（结合用户选定的 type 与 scope，引导大模型输出准确的核心动词与改动）
    aiQuestionCB: ({ type, defaultScope, maxSubjectLength, diff }) => {
      const typeHintMap = {
        feat: "以'实现'、'新增'、'支持'等准确动词开头，概括新增功能或业务特性",
        fix: "以'修复'、'消除'、'纠正'等准确动词开头，明确说明修复了什么缺陷或异常",
        refactor:
          "以'重构'、'优化'、'提取'、'调整'等动词开头，概括既不修复缺陷也不添加特性的结构调整",
        perf: "以'优化'、'提升'、'降低'等动词开头，概括性能提升或资源开销改善",
        style: "以'规范'、'格式化'等动词开头，概括不影响逻辑的代码格式变动",
        docs: "以'完善'、'补充'、'更新'等动词开头，概括文档或注释的修改",
        test: "以'增加'、'补充'、'完善'等动词开头，概括自动化测试的修改",
        build: "以'调整'、'升级'、'更新'等动词开头，概括依赖包或构建工具链变动",
        ci: "以'配置'、'调整'、'完善'等动词开头，概括 CI/CD 工作流的修改",
        chore: "以'维护'、'清理'、'配置'等动词开头，概括日常维护或辅助脚本配置",
        revert: "以'回滚'、'撤销'等动词开头，概括撤销的提交内容",
      };
      const actionHint =
        typeHintMap[type] || "以动词开头，简明扼要概括本次改动的核心逻辑";
      const scopeHint = defaultScope
        ? `涉及范围为: "${defaultScope}"，标题需聚焦于该范围，不要在描述中重复该 scope 名字。`
        : "";

      return [
        "你是一名资深架构师，正在编写遵循 Conventional Commits 规范的 Git 提交信息。",
        `本次提交选定的类型为: "${type}"。`,
        scopeHint,
        "请仔细阅读下方代码 diff，生成一句简体中文提交标题（subject），严格遵循以下要求：",
        `1. 动作精准：${actionHint}；`,
        "2. 直击本质：概括核心业务或逻辑改动，严禁使用'更新代码'、'修改部分文件'等空话套话；",
        "3. 纯净输出：仅输出 subject 本身，严禁带有任何 type/scope 前缀（如不要写 feat:、fix(...) 等），严禁包裹引号，末尾严禁添加句号（. 或 。）；",
        `4. 长度限制：严禁超过 ${maxSubjectLength} 个字符。`,
        "",
        "以下是代码 diff：",
        diff,
      ]
        .filter(Boolean)
        .join("\n");
    },
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
