# 从 30+ 条 Lint 警告谈起：shadcn 时代“源码复制型组件库”的工程化困境与破局

---

## 1. 引言：一场意料之外的“Lint 告警风暴”

随着 shadcn/ui 以及一系列微动效组件库（如 beUI）的流行，“Copy-Paste Component Registry（源码分发型组件库）”已然成为现代 React 生态的主流范式。它打破了传统 npm 包“黑盒安装、样式魔改困难”的桎梏，让开发者通过 CLI 直接把原始 `.tsx` 代码复制进自己的 `src/components/` 目录。

然而，当我们在一个严苛的现代 Monorepo 工程中（采用 Bun + Oxlint / ESLint + TypeScript Strict Mode）运行 `lint` 时，刚复制进来的几个动效组件瞬间引发了 30 多条警告和错误：

- `react(set-state-in-effect)`: Calling setState synchronously within an effect...
- `react(immutability)`: This value cannot be modified...
- `react(refs)`: Cannot access refs during render...
- `react-hooks(exhaustive-deps)`: The ref's value `.current` is accessed directly in the cleanup function...
- `react(only-export-components)`: Fast refresh only works when a file only exports components...

看着满屏的告警，一个直击灵魂的问题随之而来：
**“原作者的项目里明明配置了 Linter（如 Biome），为什么到了下游就会产生如此多的冲突？每个下游团队的 TS 和 Lint 配置都不一样，源码分发型组件库到底该如何维护？我们该不该提 Issue 让作者重写？”**

本文将从这起排查实录切入，剖析源码分发模式的底层架构矛盾，并给出业务工程的最佳治理实践。

---

## 2. 现场复盘：这 30+ 条告警究竟从何而来？

仔细梳理告警信息后，可以发现这些问题实际上由三类完全不同维度的原因导致：

### 维度一：真实的 React 运行时隐患（确定性 Bug）

并不是所有告警都是“虚惊一场”，部分告警精准指出了动效实现中的生命周期缺陷：

#### 案例 1：遗漏依赖数组引发无限更新

在测量文字宽度的弹性组件中，发现了如下代码：

```tsx
// 源码原形
useLayoutEffect(() => {
  const nextWidth = measureRef.current?.offsetWidth;
  if (!nextWidth) return;
  setWidth((current) => (current === nextWidth ? current : nextWidth));
}); // 未传入依赖数组
```

- **隐患**：缺少依赖数组意味着每次组件重渲染，该 Effect 都会无条件执行并触发 `setWidth`。一旦父级触发状态更新，极易导致级联渲染甚至性能雪崩。
- **修复**：补齐相关依赖项 `[children, cascade]`。

#### 案例 2：Cleanup 函数中的 Ref 漂移

在侧边栏关闭并恢复焦点的逻辑中：

```tsx
return () => {
  window.scrollTo(0, scrollY);
  context.triggerRef.current?.focus({ preventScroll: true });
};
```

- **隐患**：`useEffect` 清理函数在组件卸载或更新后执行。若此时触发按钮本身也随之被 React 销毁，`context.triggerRef.current` 很可能已被置空（`null`）或指向新节点。
- **修复**：在返回清理函数前将当时的 DOM 节点快照到局部变量，借助闭包维持有效引用：

```tsx
const triggerElement = context.triggerRef.current;
return () => {
  window.scrollTo(0, scrollY);
  triggerElement?.focus({ preventScroll: true });
};
```

---

### 维度二：开发环境规范与路由约定的冲突（伪告警）

- 告警：`react/only-export-components`
- **成因**：React Fast Refresh 规范要求一个文件只能导出 React 组件，以便 HMR 精准热更新。但现代文件路由框架（如 TanStack Router）强制要求路由文件必须 `export const Route = createFileRoute(...)`；同时，许多组件库为了使用便利，习惯将上下文 Hook（如 `useAnimatedSidebar`）与组件本体同文件导出。

---

### 维度三：前沿编译器规则在非适用架构上的“水土不服”

告警中占比最大的 `react(set-state-in-effect)`、`react(immutability)`、`react(refs)`，实则是 Oxlint 在开启 React 插件后，默认引入的 **React Compiler（React 19 实验性编译器）** 静态检查规则。

复杂动效库（如 Framer Motion）为了达到 60fps/120fps 的流畅体验，不可避免地会使用 Ref 进行 DOM 测量、使用 `useEffect(() => setMounted(true), [])` 判定客户端注水状态。而 React Compiler 的严格纯函数与不可变性假设，直接将这些成熟的手写优化策略判定为了“违规”。

---

## 3. 架构思辨：上游作者与下游消费者的“配置地狱”

在我们查看该组件库的根目录配置时，发现作者使用的是轻量的 Biome：

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.16/schema.json",
  "formatter": { "enabled": false },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "complexity": { "noImportantStyles": "off" },
      "security": { "noDangerouslySetInnerHtml": "off" }
    }
  }
}
```

作者的意图非常明确：**保持最小限制，保证基础语法正确即可**。

这里就暴露了源码分发模式的致命痛点：

### 传统 npm 包模式（黑盒）

- 组件被预编译为 JS Bundle 和 `.d.ts` 类型声明文件。
- 下游项目的 ESLint、Oxlint、TypeScript 默认**完全忽略 `node_modules`**。
- 只要对外暴露的 Props 类型通过检查，内部即便写得再激进，下游也无从感知。

### 源码复制模式（白盒）

- 原始未编译的 TypeScript / JSX 代码直接落在业务工程的 `src/` 下。
- 它瞬间从“第三方依赖”降维成了**第一方业务代码**。
- 下游启用的每一条极度严格的静态规则（如 TypeScript 的 `exactOptionalPropertyTypes`、ESLint 的 React Compiler 规则、Oxlint 的定制 rules），都会无差别地审查这些借来的组件。

### 那我们该给上游提 Issue 让他们按 Lint 规则重构吗？

**答案显然是不现实的。**
前端社区的 Linter 生态极其碎片化：ESLint（包含各家预设）、Biome、Oxlint、Deno Lint 各自为政。上游维护者如果为了满足团队 A 的规则修改了代码，极可能会触发团队 B 的冲突报警。上游的核心职责是维护跨端兼容性与运行正确性，而不是成为“全网 Linter 规则收集器”。

---

## 4. 破局之道：下游工程的三层治理策略

作为下游消费者，我们既想享受复制型组件的灵活性，又不想被满屏的告警阻塞 CI/CD 流程，应当如何在工程中进行优雅治理？

### 策略一：确立“代码所有权（You Own It）”思维

shadcn 模式的核心哲学就是：**“一旦你复制了代码，它就属于你。”**
不要把组件库当成神圣不可侵犯的第三方黑盒。当发现真正的 Hook 缺陷（如缺少依赖项、Ref 清理脱钩）时，果断就地重构修复。若逻辑具备通用价值，可向上游提交明确的 Bugfix PR（而非“请求适配 Lint”的大而化之的 Issue）。

### 策略二：在配置文件中精准划定“豁免区”

对于第三方的 UI/动效模板代码，没必要用对待核心金融业务逻辑的标准去苛求它。在 `oxlintrc.json` 或 `eslintrc` 中，善用 `overrides` 进行分层管理：

```json
{
  "plugins": ["typescript", "oxc"],
  "overrides": [
    {
      "files": ["**/apps/frontend/**", "**/*.tsx"],
      "plugins": ["react"],
      "rules": {
        "react/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
        // 关闭非当前架构适配的 React Compiler 实验性规则
        "react/set-state-in-effect": "off",
        "react/immutability": "off",
        "react/refs": "off",
        "react/only-export-components": "off"
      }
    }
  ]
}
```

### 策略三：Monorepo 任务分发与作用域收敛

在多包工程（Monorepo）中，避免在根目录下直接执行无差别的全局扫描。应当像管理 `typecheck` 一样，利用包管理器的过滤能力向下分发任务：

```json
// 根目录 package.json
{
  "scripts": {
    "lint": "bun run --filter './apps/*' --filter './packages/*' lint"
  }
}
```

各子模块（前端、后端、共享类型包）只扫描各自的 `src` 目录，前端独享 React 检查，后端排除前端规则，数据库迁移快照与外部工具目录彻底加入 `ignorePatterns`。

---

## 5. 结语

组件分发模式从“npm 黑盒”演进至“源码白盒”，本质上是一场**关于控制权与责任边界的转移**：它赋予了前端工程师 100% 的定制自由度，同时也要求工程师必须承担起消化代码、审查生命周期隐患与管理工程化边界的责任。

下次再遇到引入组件库导致的 Lint 刷屏时，不妨停下抱怨：

1. 挑出那些隐蔽的 **React 真实生命周期 Bug** 并消灭它；
2. 关掉那些 **不合时宜的编译器过度审查**；
3. 为这套完全属于你自己的组件代码，建立清晰整洁的工程防线。
