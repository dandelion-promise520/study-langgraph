# AI 智能体与代码开发规范指南 (AI Agent Guidelines)

本仓库通过 **Commitlint** 与 **Husky** 强制约束代码提交（Git Commit）规范。

---

## 📌 Git 提交规范 (Commit Convention)

所有提交信息必须严格遵循 **Conventional Commits（约定式提交）** 规范。

### 1. 核心流程与指令

- **查看当前生效规则**：`npx commitlint --print-config json`
- **提交前预校验**：`printf '%s' "<commit message>" | npx commitlint`（退出码为 0 表示校验通过）
- **拦截与自我修正**：如果被 `commit-msg` 钩子拦截，请根据报错信息中方括号内的规则名（如 `[subject-case]`、`[type-enum]`）进行针对性修正后重试。**严禁使用 `git commit --no-verify` 跳过校验！**

---

### 2. 提交格式 (Message Format)

```text
type(scope?): subject

[可选的详细描述 body]

[可选的关联 issue 或破坏性变更 footer]
```

---

### 3. 支持的类型 (Types)

| 类型 (`type`)  | 中文说明      | 适用场景                                         |
| :------------- | :------------ | :----------------------------------------------- |
| **`feat`**     | ✨ 新特性     | 新增业务功能、模块或接口                         |
| **`fix`**      | 🐛 修复缺陷   | 修复 Bug 或逻辑错误                              |
| **`docs`**     | 📚 文档更新   | 补充或修改 README、注释、规范文档                |
| **`style`**    | 💎 代码格式   | 不影响代码运行的格式化变动（空格、标点、缩进等） |
| **`refactor`** | 📦 代码重构   | 既不修复错误也不添加特性的结构调整               |
| **`perf`**     | 🚀 性能优化   | 提高运行速度、降低内存占用的改动                 |
| **`test`**     | 🚨 自动化测试 | 添加或修改单元测试、集成测试                     |
| **`build`**    | 🛠️ 构建与依赖 | 依赖包更新、构建工具配置（catalog、tsconfig 等） |
| **`ci`**       | ⚙️ 持续集成   | CI/CD 流程、GitHub Actions 脚本变更              |
| **`chore`**    | ♻️ 日常维护   | 杂项变动、工具链配置、脚本辅助等                 |
| **`revert`**   | 🗑️ 回滚提交   | 撤销之前的某个 Git 提交                          |

---

### 4. 支持的作用域 (Scopes)

| 作用域 (`scope`) | 对应模块 / 范围                               |
| :--------------- | :-------------------------------------------- |
| **`root`**       | 根目录工程配置、工作区配置                    |
| **`backend`**    | 后端服务 (`apps/backend`)                     |
| **`frontend`**   | 前端应用 (`apps/frontend`)                    |
| **`types`**      | 共享类型包 (`packages/types`)                 |
| **`agent`**      | LangGraph 智能体业务逻辑与图定义              |
| **`ui`**         | 前端通用 UI 与页面组件                        |
| **`motion`**     | 动画与手势交互相关模块                        |
| **`config`**     | 配置文件（commitlint、lint-staged、husky 等） |
| **`deps`**       | 依赖版本管理与升级                            |

---

### 5. 标题规范 (Subject Rules)

- 简明扼要，描述本次修改的核心动作。
- 英文使用祈使语气（小写开头），中文描述清晰规范。
- **末尾严禁添加句号（`.` 或 `。`）**。