# AI Desktop 项目初始化 — 基础架构搭建

## TL;DR

> **Quick Summary**: 使用 electron-vite 官方脚手架初始化 Electron + Vue 3 + TypeScript 桌面应用项目，搭建完整的三进程架构（main/preload/renderer）、IPC 通信层、SQLite 数据层、Pinia 状态管理、Vue Router 路由、TailwindCSS v4 样式系统，以及系统托盘、自动更新、全局快捷键、多窗口管理等桌面端基础能力，并配置测试基础设施和代码规范工具，最终生成 AGENTS.md 知识库文件。
>
> **Deliverables**:
>
> - 完整可运行的 Electron + Vue 3 项目骨架
> - main/preload/renderer 三进程架构（严格隔离，contextBridge IPC）
> - SQLite 数据层（better-sqlite3 + WAL 模式）
> - Vue Router (Hash Mode) 基础路由
> - Pinia (Setup API) 状态管理
> - TailwindCSS v4 样式配置 + 基础布局（侧边栏 + 内容区）
> - 系统托盘 + 自动更新 + 全局快捷键 + 多窗口管理
> - Vitest + Playwright 测试基础设施
> - ESLint + Prettier 代码规范
> - electron-builder 打包配置（macOS + Windows）
> - AGENTS.md 知识库文件
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Task 1 → Task 5 → Task 6 → Task 9 → Task 10 → Task 11 → Task 14 → Task 19 → Task 20

---

## Context

### Original Request

用户需要开发一个桌面 AI 工具，技术栈使用 TypeScript。当前目标：搭建完整的基础架构和项目配置，具体 AI 功能后续迭代。项目目前仅有 README.md、LICENSE 和 .git。

### Interview Summary

**Key Discussions**:

- 核心定位：先搭基础架构，具体功能后续再加
- 桌面框架：Electron（严格主进程/渲染进程分离）
- 前端：Vue 3 + TailwindCSS + Pinia + Vue Router
- 构建：electron-vite + Vite
- 数据存储：SQLite（better-sqlite3）
- 测试：Vitest + Playwright
- 附加能力：系统托盘 + 自动更新 + 全局快捷键 + 多窗口管理
- 代码规范：ESLint + Prettier（轻量级，不配 Husky）
- 目标平台：macOS + Windows

**Research Findings**:

- electron-vite 是 Electron + Vite 的官方推荐集成，内置三进程热重载
- better-sqlite3 比 sql.js 快 11.7x，同步 API 更简单
- TailwindCSS v4 使用 @tailwindcss/vite 插件，零配置文件
- 官方模板使用 @electron-toolkit/preload 和 @electron-toolkit/utils
- 官方模板设置 sandbox: false + contextIsolation: true（有原生模块时必需）

### Metis Review

**Identified Gaps** (addressed):

- **版本选择**：使用稳定版本（Electron 33-35, electron-vite 4.x, Vue Router 4.x, Pinia 2.x），避免使用刚发布的 breaking change 大版本
- **脚手架基线**：必须从 `npm create @quick-start/electron` 开始，不手动搭建
- **缺失依赖**：@electron-toolkit/preload, @electron-toolkit/utils
- **sandbox 设置**：sandbox: false + contextIsolation: true（匹配官方模板）
- **单实例锁**：app.requestSingleInstanceLock() 必须包含
- **ASAR 解包**：better-sqlite3 原生 .node 文件必须 asarUnpack
- **postinstall 脚本**：electron-builder install-app-deps 重建原生模块
- **TypeScript 配置**：3 文件结构（tsconfig.json + tsconfig.node.json + tsconfig.web.json）

---

## Work Objectives

### Core Objective

搭建一个生产级质量的 Electron + Vue 3 桌面应用基础架构，包含三进程隔离、IPC 通信、数据持久化、状态管理、路由、样式系统、桌面端特性、测试基础设施和代码规范。

### Concrete Deliverables

- 可通过 `npm run dev` 启动的开发环境
- 可通过 `npm run build` 构建的生产版本
- 可通过 `npm run build:mac` / `npm run build:win` 打包的安装包
- 通过 IPC 可端到端通信的三进程架构
- 可读写 app_settings 表的 SQLite 数据层
- 带侧边栏导航和内容区的基础 UI 布局
- 系统托盘 + 全局快捷键 + 多窗口 + 自动更新

### Definition of Done

- [ ] `npm run dev` 启动应用，窗口正常显示
- [ ] `npm run build` 构建成功，输出到 out/ 目录
- [ ] `npx vitest run` 通过，至少 1 个测试
- [ ] `npx eslint .` 无错误
- [ ] `npm run typecheck` 无类型错误
- [ ] IPC ping/pong 端到端测试通过
- [ ] SQLite 可读写 app_settings 表
- [ ] 系统托盘正常工作
- [ ] AGENTS.md 文件已生成

### Must Have

- electron-vite 官方脚手架生成的项目基线
- 严格的三进程隔离（contextIsolation: true）
- 类型安全的 IPC 通信层
- SQLite 数据层（主进程 only）
- Vue Router Hash Mode
- Pinia Setup API
- TailwindCSS v4
- 系统托盘
- 自动更新（electron-updater）
- 全局快捷键
- 多窗口管理
- 单实例锁
- Vitest + Playwright 配置
- ESLint + Prettier
- electron-builder（macOS + Windows）
- AGENTS.md 知识库

### Must NOT Have (Guardrails)

- ❌ 不构建通用 IPC 框架（简单的 ipcMain.handle/ipcRenderer.invoke 即可）
- ❌ 不创建可复用 UI 组件库（仅布局外壳）
- ❌ 不设计数据库 schema（仅 app_settings 表）
- ❌ 不实现自动更新 UI（仅 checkForUpdatesAndNotify）
- ❌ 不添加 CI/CD 配置
- ❌ 不使用 Vue Router 5.x 或 Pinia 3.x（太新，不稳定）
- ❌ 不使用 Electron 40+ 或 electron-vite 5.x（未经充分测试）
- ❌ 不跳过 postinstall 原生模块重建步骤
- ❌ 不使用 nodeIntegration: true
- ❌ 不过度注释代码或过度抽象
- ❌ 不添加代码签名或发布配置
- ❌ 不在 preload 或 renderer 中导入 better-sqlite3

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.

### Test Decision

- **Infrastructure exists**: NO (greenfield)
- **Automated tests**: YES (Tests-after) - 先搭建基础设施，再写验证测试
- **Framework**: Vitest (unit) + Playwright (E2E)

### QA Policy

Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright (playwright skill) - Navigate, interact, assert DOM, screenshot
- **Electron Features**: Use Bash - Run commands, check exit codes, verify file output
- **Build/Packaging**: Use Bash - Run build, verify artifacts exist
- **IPC/Database**: Use Bash - Run test scripts, verify console output

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation - 脚手架 + 依赖 + 配置):
├── Task 1: electron-vite 脚手架初始化 [deep]
├── Task 2: 安装额外依赖 + 版本锁定 [quick]
├── Task 3: ESLint + Prettier 配置 [quick]
└── Task 4: TypeScript 配置优化 [quick]

Wave 2 (Core Architecture - 核心架构层):
├── Task 5: 目录结构重组 + 架构搭建 (depends: 1, 2) [deep]
├── Task 6: IPC 通信层 + 类型定义 (depends: 4, 5) [deep]
├── Task 7: SQLite 数据层 (depends: 2, 5) [unspecified-high]
├── Task 8: Vue Router 路由配置 (depends: 5) [quick]
├── Task 9: Pinia 状态管理 (depends: 5) [quick]
└── Task 10: TailwindCSS v4 + 基础 UI 布局 (depends: 5) [visual-engineering]

Wave 3 (Desktop Features - 桌面端特性):
├── Task 11: 系统托盘 + 单实例锁 (depends: 6) [unspecified-high]
├── Task 12: 多窗口管理 (depends: 6, 10) [unspecified-high]
├── Task 13: 全局快捷键 (depends: 11) [quick]
├── Task 14: 自动更新 + electron-builder 打包 (depends: 2, 11) [unspecified-high]
└── Task 15: 异常处理 + CSP 安全策略 (depends: 6, 7) [quick]

Wave 4 (Quality + Documentation - 质量 + 文档):
├── Task 16: Vitest 测试基础设施 + 示例测试 (depends: 5-10) [unspecified-high]
├── Task 17: Playwright E2E 测试基础设施 (depends: 14) [unspecified-high]
├── Task 18: 完整构建验证 + 端到端测试 (depends: 14, 16, 17) [deep]
├── Task 19: AGENTS.md 知识库生成 (depends: ALL) [writing]
└── Task 20: 清理 + 最终验证 (depends: 18, 19) [deep]

Wave FINAL (Review):
├── F1: Plan compliance audit (oracle)
├── F2: Code quality review (unspecified-high)
├── F3: Real manual QA (unspecified-high + playwright)
└── F4: Scope fidelity check (deep)
→ Present results → Get explicit user okay

Critical Path: Task 1 → Task 5 → Task 6 → Task 11 → Task 14 → Task 18 → Task 20 → F1-F4
Parallel Speedup: ~60% faster than sequential
Max Concurrent: 6 (Wave 2)
```

### Dependency Matrix

| Task | Depends On | Blocks             | Wave |
| ---- | ---------- | ------------------ | ---- |
| 1    | -          | 2, 3, 4, 5         | 1    |
| 2    | 1          | 5, 7, 14           | 1    |
| 3    | 1          | 16                 | 1    |
| 4    | 1          | 5, 6               | 1    |
| 5    | 1, 2       | 6, 7, 8, 9, 10     | 2    |
| 6    | 4, 5       | 11, 12, 13, 14, 15 | 2    |
| 7    | 2, 5       | 15, 16             | 2    |
| 8    | 5          | 16, 18             | 2    |
| 9    | 5          | 16, 18             | 2    |
| 10   | 5          | 12, 16, 18         | 2    |
| 11   | 6          | 13, 14             | 3    |
| 12   | 6, 10      | 18                 | 3    |
| 13   | 11         | 18                 | 3    |
| 14   | 2, 11      | 17, 18             | 3    |
| 15   | 6, 7       | 18                 | 3    |
| 16   | 5-10       | 18                 | 4    |
| 17   | 14         | 18                 | 4    |
| 18   | 14, 16, 17 | 20                 | 4    |
| 19   | ALL        | 20                 | 4    |
| 20   | 18, 19     | F1-F4              | 4    |

### Agent Dispatch Summary

- **Wave 1**: 4 tasks - T1 → `deep`, T2-T4 → `quick`
- **Wave 2**: 6 tasks - T5-T6 → `deep`, T7 → `unspecified-high`, T8-T9 → `quick`, T10 → `visual-engineering`
- **Wave 3**: 5 tasks - T11-T12, T14 → `unspecified-high`, T13, T15 → `quick`
- **Wave 4**: 5 tasks - T16-T17 → `unspecified-high`, T18 → `deep`, T19 → `writing`, T20 → `deep`
- **FINAL**: 4 tasks - F1 → `oracle`, F2-F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. electron-vite 脚手架初始化

  **What to do**:
  - 运行 `npm create @quick-start/electron@latest` 选择 Vue + TypeScript 模板
  - 确认脚手架生成的文件结构：`src/main/`, `src/preload/`, `src/renderer/`
  - 确认生成的配置文件：`electron.vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `tsconfig.web.json`, `electron-builder.yml`
  - 确认 `package.json` 中的 scripts：`dev`, `build`, `preview`, `postinstall`
  - 验证 `npm run dev` 能启动应用
  - 验证 `npm run build` 能成功构建
  - 注意：保留已有的 README.md 和 LICENSE（脚手架可能覆盖 README.md，需恢复）

  **Must NOT do**:
  - 不修改脚手架生成的默认配置
  - 不删除任何脚手架生成的文件
  - 不安装额外依赖（下一个任务处理）

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 需要理解 electron-vite 脚手架输出并验证其正确性
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: 此任务仅验证脚手架，不需要浏览器自动化

  **Parallelization**:
  - **Can Run In Parallel**: NO (Wave 1 基础，所有后续任务依赖)
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 2, 3, 4, 5
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `electron-vite` 官方文档: https://electron-vite.org/guide/ — 脚手架使用方法和模板结构
  - `alex8088/quick-start` 仓库 Vue+TS 模板: https://github.com/alex8088/quick-start/tree/master/packages/create-electron/playground/vue-ts — 参考模板生成的文件结构

  **External References**:
  - electron-vite 官方 Getting Started: https://electron-vite.org/guide/getting-started.html
  - 脚手架命令: `npm create @quick-start/electron@latest`

  **WHY Each Reference Matters**:
  - electron-vite 文档：确认脚手架命令和选项
  - Vue+TS 模板：了解生成的文件结构和默认配置，用于后续验证

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 脚手架项目可启动
    Tool: Bash
    Preconditions: 项目目录中已有脚手架生成的文件
    Steps:
      1. 运行 `npm run dev`
      2. 等待 10 秒让 Electron 窗口启动
      3. 检查进程是否存在（pgrep -f electron）
    Expected Result: Electron 进程运行中，无错误输出
    Failure Indicators: 进程不存在，控制台有 Error 输出
    Evidence: .sisyphus/evidence/task-1-scaffold-dev.txt

  Scenario: 脚手架项目可构建
    Tool: Bash
    Preconditions: 依赖已安装
    Steps:
      1. 运行 `npm run build`
      2. 检查 out/ 目录是否存在
      3. 检查 out/main/index.js, out/preload/index.js, out/renderer/index.html 是否存在
    Expected Result: 构建成功退出码 0，out/ 目录包含三进程输出
    Failure Indicators: 退出码非 0，out/ 目录缺失任何子目录
    Evidence: .sisyphus/evidence/task-1-scaffold-build.txt

  Scenario: 项目结构符合 electron-vite 规范
    Tool: Bash
    Preconditions: 脚手架已运行
    Steps:
      1. 验证 src/main/index.ts 存在
      2. 验证 src/preload/index.ts 存在
      3. 验证 src/renderer/src/ 目录存在
      4. 验证 electron.vite.config.ts 存在
      5. 验证 tsconfig.json, tsconfig.node.json, tsconfig.web.json 存在
    Expected Result: 所有文件路径存在
    Failure Indicators: 任一文件不存在
    Evidence: .sisyphus/evidence/task-1-scaffold-structure.txt
  ```

  **Commit**: YES
  - Message: `feat(init): scaffold electron-vite project with Vue + TS template`
  - Files: 全部脚手架生成文件
  - Pre-commit: `npm run build`

- [x] 2. 安装额外依赖 + 版本锁定

  **What to do**:
  - 安装核心依赖（精确版本，不使用 ^ 或 ~）：
    - `vue-router@4` (Hash Mode 路由)
    - `pinia@2` (状态管理)
    - `better-sqlite3@12` (SQLite 数据库)
    - `electron-updater@6` (自动更新)
  - 安装开发依赖：
    - `tailwindcss@4` + `@tailwindcss/vite` (TailwindCSS v4)
    - `@playwright/test` + `@playwright/electron` (E2E 测试)
    - `vitest` + `@vue/test-utils` + `happy-dom` (单元测试)
    - `prettier` (代码格式化)
    - `@electron-toolkit/preload` + `@electron-toolkit/utils` (官方工具包)
  - 确认 package.json 中所有版本号为精确版本（无 ^ ~ 前缀）
  - 确认 `postinstall` 脚本包含 `electron-builder install-app-deps`
  - 运行 `npm install` 确认所有依赖安装成功

  **Must NOT do**:
  - 不安装 Vue Router 5.x 或 Pinia 3.x（太新）
  - 不安装 ORM（如 Drizzle, Prisma）
  - 不安装 UI 组件库
  - 不安装 Husky 或 lint-staged

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 纯依赖安装，步骤明确
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 Task 3, 4 并行）
  - **Parallel Group**: Wave 1 (with Tasks 3, 4)
  - **Blocks**: Tasks 5, 7, 14
  - **Blocked By**: Task 1

  **References**:

  **External References**:
  - better-sqlite3 npm: https://www.npmjs.com/package/better-sqlite3 — 版本和安装说明
  - electron-updater 文档: https://www.electron.build/auto-update — 版本兼容性
  - TailwindCSS v4 安装: https://tailwindcss.com/docs/installation/vite — Vite 插件安装方式

  **WHY Each Reference Matters**:
  - better-sqlite3: 确认与 Electron 兼容的最新稳定版本
  - electron-updater: 确认与 electron-builder 的版本匹配
  - TailwindCSS v4: 确认 Vite 插件的正确安装方式

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 所有依赖安装成功
    Tool: Bash
    Preconditions: Task 1 完成
    Steps:
      1. 运行 `npm install`
      2. 检查 node_modules/ 目录存在
      3. 运行 `node -e "require('better-sqlite3')"` 验证 native 模块
      4. 运行 `node -e "require('vue-router')"` 验证
      5. 运行 `node -e "require('pinia')"` 验证
    Expected Result: 所有 require 成功，无错误
    Failure Indicators: 任何 require 抛出 MODULE_NOT_FOUND
    Evidence: .sisyphus/evidence/task-2-deps-install.txt

  Scenario: 版本号精确锁定
    Tool: Bash
    Preconditions: package.json 已更新
    Steps:
      1. 运行 `cat package.json | grep -E '"(vue-router|pinia|better-sqlite3|tailwindcss)"'`
      2. 验证无 ^ 或 ~ 前缀
    Expected Result: 所有版本号为精确版本（如 "4.5.0" 而非 "^4.5.0"）
    Failure Indicators: 存在 ^ 或 ~ 前缀
    Evidence: .sisyphus/evidence/task-2-deps-versions.txt

  Scenario: postinstall 包含原生模块重建
    Tool: Bash
    Preconditions: package.json 已更新
    Steps:
      1. 检查 package.json scripts.postinstall 包含 "electron-builder install-app-deps"
    Expected Result: postinstall 脚本存在且包含 electron-builder install-app-deps
    Failure Indicators: 缺失 postinstall 或不含 install-app-deps
    Evidence: .sisyphus/evidence/task-2-deps-postinstall.txt
  ```

  **Commit**: YES
  - Message: `chore(deps): install additional dependencies with pinned versions`
  - Files: `package.json`, `package-lock.json`
  - Pre-commit: `npm install`

- [x] 3. ESLint + Prettier 配置

  **What to do**:
  - 验证/修改脚手架生成的 `eslint.config.mjs`（ESLint flat config 格式）
  - 添加 Vue 相关 ESLint 规则（eslint-plugin-vue）
  - 添加 TypeScript ESLint 规则（@typescript-eslint/eslint-plugin）
  - 添加 Electron 相关规则（禁止 nodeIntegration, 要求 contextIsolation）
  - 创建 `.prettierrc` 配置文件：
    - singleQuote: true
    - semi: false
    - tabWidth: 2
    - trailingComma: 'all'
    - printWidth: 100
  - 创建 `.prettierignore` 文件（忽略 out/, dist/, node_modules/）
  - 添加 npm scripts: `lint`, `lint:fix`, `format`
  - 运行 `npx eslint .` 确认通过
  - 运行 `npx prettier --check .` 确认通过

  **Must NOT do**:
  - 不配置 Husky 或 lint-staged
  - 不配置过于严格的 ESLint 规则
  - 不添加 Prettier ESLint 插件（eslint-config-prettier 足够处理冲突）

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 配置文件创建，步骤明确
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 Task 2, 4 并行）
  - **Parallel Group**: Wave 1 (with Tasks 2, 4)
  - **Blocks**: Task 16
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - 脚手架生成的 `eslint.config.mjs` — 作为基础配置
  - eslint-plugin-vue: https://eslint.vuejs.org/ — Vue 3 推荐规则

  **External References**:
  - ESLint Flat Config: https://eslint.org/docs/latest/use/configure/configuration-files-new — flat config 格式
  - Prettier Options: https://prettier.io/docs/en/options.html — 配置选项

  **WHY Each Reference Matters**:
  - 脚手架配置：基于已有配置扩展，不重复造轮子
  - eslint-plugin-vue：Vue 3 特定的 lint 规则

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: ESLint 配置有效
    Tool: Bash
    Preconditions: eslint.config.mjs 已创建
    Steps:
      1. 运行 `npx eslint .`
    Expected Result: 退出码 0，无错误（可能有警告）
    Failure Indicators: 退出码非 0
    Evidence: .sisyphus/evidence/task-3-eslint.txt

  Scenario: Prettier 格式化正常
    Tool: Bash
    Preconditions: .prettierrc 已创建
    Steps:
      1. 运行 `npx prettier --check "src/**/*.{ts,vue}" `
    Expected Result: 所有文件格式检查通过或自动格式化后通过
    Failure Indicators: 格式化报错
    Evidence: .sisyphus/evidence/task-3-prettier.txt

  Scenario: npm scripts 存在
    Tool: Bash
    Preconditions: package.json 已更新
    Steps:
      1. 运行 `npm run lint -- --help` 验证 script 存在
    Expected Result: lint script 可执行
    Failure Indicators: npm ERR! missing script
    Evidence: .sisyphus/evidence/task-3-scripts.txt
  ```

  **Commit**: YES
  - Message: `chore(lint): configure ESLint flat config + Prettier`
  - Files: `eslint.config.mjs`, `.prettierrc`, `.prettierignore`, `package.json`
  - Pre-commit: `npx eslint .`

- [x] 4. TypeScript 配置优化

  **What to do**:
  - 验证三文件 TypeScript 配置结构：
    - `tsconfig.json`（根配置，引用 node 和 web）
    - `tsconfig.node.json`（main + preload 进程，Node.js 环境）
    - `tsconfig.web.json`（renderer 进程，浏览器环境）
  - 确认 `tsconfig.node.json` 包含：
    - `"module": "ESNext"`, `"moduleResolution": "bundler"`
    - `"types": ["node"]`
    - include 路径覆盖 `src/main/**/*` 和 `src/preload/**/*`
  - 确认 `tsconfig.web.json` 包含：
    - `"module": "ESNext"`, `"moduleResolution": "bundler"`
    - 不包含 `"types": ["node"]`
    - include 路径覆盖 `src/renderer/src/**/*`
  - 添加路径别名：`@/` → `src/renderer/src/`
  - 添加 `src/preload/index.d.ts` 类型声明文件（声明 window.electronAPI 类型）
  - 运行 `npm run typecheck`（或 `npx vue-tsc --noEmit`）确认通过

  **Must NOT do**:
  - 不合并为单个 tsconfig 文件
  - 不修改 target 为非 ESNext
  - 不启用 `allowJs: true`

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 配置文件验证和微调
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 Task 2, 3 并行）
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Tasks 5, 6
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - 脚手架生成的 `tsconfig.json`, `tsconfig.node.json`, `tsconfig.web.json` — 基础配置
  - 脚手架生成的 `src/preload/index.d.ts` — window.electronAPI 类型声明基线

  **External References**:
  - electron-vite TypeScript 指南: https://electron-vite.org/guide/typescript.html — TS 配置建议

  **WHY Each Reference Matters**:
  - 脚手架配置：基于已有配置优化，确保兼容性
  - electron-vite 文档：确认官方推荐的 TS 配置方式

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: TypeScript 类型检查通过
    Tool: Bash
    Preconditions: tsconfig 文件已配置
    Steps:
      1. 运行 `npx vue-tsc --noEmit`
    Expected Result: 退出码 0，无类型错误
    Failure Indicators: 退出码非 0，存在类型错误
    Evidence: .sisyphus/evidence/task-4-typecheck.txt

  Scenario: 三文件 TS 配置结构正确
    Tool: Bash
    Preconditions: tsconfig 文件已配置
    Steps:
      1. 检查 tsconfig.json 存在 references 字段
      2. 检查 tsconfig.node.json 的 include 包含 src/main 和 src/preload
      3. 检查 tsconfig.web.json 的 include 包含 src/renderer
    Expected Result: 三文件结构完整且引用关系正确
    Failure Indicators: 缺失文件或引用关系错误
    Evidence: .sisyphus/evidence/task-4-tsconfig.txt
  ```

  **Commit**: YES
  - Message: `chore(ts): optimize TypeScript configuration for Electron`
  - Files: `tsconfig.json`, `tsconfig.node.json`, `tsconfig.web.json`, `src/preload/index.d.ts`
  - Pre-commit: `npx vue-tsc --noEmit`

- [x] 5. 目录结构重组 + 架构搭建

  **What to do**:
  - 在脚手架基础上创建完整的项目目录结构：
    ```
    src/
    ├── main/                    # 主进程
    │   ├── index.ts             # 入口（从脚手架继承，需修改）
    │   ├── ipc/                 # IPC 处理器
    │   │   └── index.ts         # IPC 注册入口
    │   ├── database/            # 数据库层
    │   │   └── index.ts         # 数据库连接和初始化
    │   ├── windows/             # 窗口管理
    │   │   └── index.ts         # 窗口创建函数
    │   ├── tray.ts              # 系统托盘
    │   ├── updater.ts           # 自动更新
    │   └── hotkey.ts            # 全局快捷键
    ├── preload/
    │   ├── index.ts             # contextBridge（从脚手架继承）
    │   └── index.d.ts           # 类型声明（从脚手架继承）
    └── renderer/
        ├── index.html           # HTML 入口
        └── src/
            ├── App.vue          # 根组件
            ├── main.ts          # Vue 入口
            ├── assets/          # 静态资源
            │   └── main.css     # TailwindCSS 入口
            ├── router/          # Vue Router
            │   └── index.ts
            ├── stores/          # Pinia stores
            │   └── app.ts       # 应用级 store
            ├── views/           # 页面视图
            │   ├── Home.vue
            │   └── Settings.vue
            ├── components/      # 组件
            │   └── layout/      # 布局组件
            │       ├── AppSidebar.vue
            │       └── AppLayout.vue
            └── composables/     # 组合式函数
                └── useElectron.ts  # Electron API 封装
    ```
  - 修改 `src/main/index.ts`：提取窗口创建逻辑到 `windows/index.ts`，添加单实例锁（`app.requestSingleInstanceLock()`）
  - 创建空的占位模块文件（后续任务填充）
  - 确保 `npm run dev` 仍然可以正常启动

  **Must NOT do**:
  - 不实现具体功能逻辑（仅创建目录和空/骨架文件）
  - 不创建通用组件库
  - 不破坏脚手架已有的可运行状态

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 需要理解 Electron 架构并正确组织目录结构
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO（Wave 2 基础任务）
  - **Parallel Group**: Wave 2 (blocks all Wave 2 tasks)
  - **Blocks**: Tasks 6, 7, 8, 9, 10
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References**:
  - 脚手架生成的 `src/main/index.ts` — 主进程入口基线
  - 脚手架生成的 `src/renderer/src/` — 渲染进程结构基线
  - electron-vite Vue+TS 模板结构 — 参考 `alex8088/quick-start/packages/create-electron/playground/vue-ts/`

  **External References**:
  - Electron 进程模型: https://www.electronjs.org/docs/latest/tutorial/process-model — 三进程架构说明

  **WHY Each Reference Matters**:
  - 脚手架基线：确保在已有结构上扩展，不破坏
  - 进程模型文档：理解 main/preload/renderer 的职责划分

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 目录结构完整
    Tool: Bash
    Preconditions: Task 1, 2 完成
    Steps:
      1. 验证 src/main/ipc/ 目录存在
      2. 验证 src/main/database/ 目录存在
      3. 验证 src/main/windows/ 目录存在
      4. 验证 src/renderer/src/router/ 目录存在
      5. 验证 src/renderer/src/stores/ 目录存在
      6. 验证 src/renderer/src/views/ 目录存在
      7. 验证 src/renderer/src/components/layout/ 目录存在
      8. 验证 src/renderer/src/composables/ 目录存在
    Expected Result: 所有目录和占位文件存在
    Failure Indicators: 任一目录缺失
    Evidence: .sisyphus/evidence/task-5-structure.txt

  Scenario: 重构后仍可运行
    Tool: Bash
    Preconditions: 目录结构已创建
    Steps:
      1. 运行 `npm run build`
      2. 检查退出码为 0
      3. 运行 `npm run dev`（后台运行 10 秒后 kill）
      4. 确认无启动错误
    Expected Result: 构建和启动均成功
    Failure Indicators: 构建失败或启动报错
    Evidence: .sisyphus/evidence/task-5-build.txt
  ```

  **Commit**: YES
  - Message: `feat(arch): reorganize directory structure for desktop app architecture`
  - Files: 所有新目录和文件
  - Pre-commit: `npm run build`

- [x] 6. IPC 通信层 + 类型定义

  **What to do**:
  - 创建 `src/shared/types/index.ts` — 共享类型定义文件（main 和 renderer 都可访问）
  - 定义 IPC 通道类型（使用联合类型确保类型安全）：
    ```typescript
    // 示例结构（实际实现时精简）
    // IPC 通道名枚举/常量
    // 请求/响应类型映射
    // electronAPI 接口定义
    ```
  - 创建 `src/main/ipc/index.ts` — 主进程 IPC 处理器注册
    - 实现 2-3 个示例处理器：ping/pong, getAppInfo, getSettings
    - 使用 `ipcMain.handle` （双向通信）
  - 更新 `src/preload/index.ts` — 使用 @electron-toolkit/preload 暴露类型安全的 API
  - 更新 `src/preload/index.d.ts` — 声明 window.electronAPI 的完整类型
  - 创建 `src/renderer/src/composables/useElectron.ts` — 渲染进程端 Electron API 封装
  - 确保 IPC 通信端到端可工作（renderer → preload → main → 返回）

  **Must NOT do**:
  - 不构建通用 IPC 框架/中间件/验证层
  - 不超过 5 个 IPC 处理器
  - 不使用 ipcMain.on（仅用 ipcMain.handle 双向通信）
  - 不在 preload 中暴露整个 ipcRenderer

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 需要深入理解 Electron IPC 和 TypeScript 类型系统
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 Tasks 7, 8, 9, 10 并行）
  - **Parallel Group**: Wave 2 (with Tasks 7, 8, 9, 10)
  - **Blocks**: Tasks 11, 12, 13, 14, 15
  - **Blocked By**: Tasks 4, 5

  **References**:

  **Pattern References**:
  - 脚手架生成的 `src/preload/index.ts` — preload 基线（使用 @electron-toolkit/preload）
  - 脚手架生成的 `src/preload/index.d.ts` — 类型声明基线
  - electron-vite IPC 教程: https://electron-vite.org/guide/dev#ipc-communication

  **API/Type References**:
  - @electron-toolkit/preload API — contextBridge 封装工具
  - Electron ipcMain.handle 文档: https://www.electronjs.org/docs/latest/api/ipc-main

  **External References**:
  - Electron Context Isolation: https://www.electronjs.org/docs/latest/tutorial/context-isolation — 安全通信模式

  **WHY Each Reference Matters**:
  - 脚手架基线：已有 preload 使用 @electron-toolkit/preload 的模式
  - Context Isolation 文档：理解为什么只能暴露特定 API，不能暴露整个 ipcRenderer

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: IPC ping/pong 端到端通信
    Tool: Bash
    Preconditions: 应用可启动
    Steps:
      1. 在 src/main/ipc/index.ts 中注册 ping handler：
         ipcMain.handle('ping', () => 'pong')
      2. 在 renderer 中调用 window.electronAPI.ping()
      3. 在构建输出中确认无类型错误
      4. 运行 `npm run build` 确认编译通过
    Expected Result: TypeScript 编译通过，IPC 类型正确推断
    Failure Indicators: 类型错误或构建失败
    Evidence: .sisyphus/evidence/task-6-ipc-types.txt

  Scenario: 类型安全的 electronAPI
    Tool: Bash
    Preconditions: 类型定义已创建
    Steps:
      1. 运行 `npx vue-tsc --noEmit`
      2. 在 renderer 代码中尝试调用不存在的 API（如 window.electronAPI.nonExistent()）
      3. 确认 TypeScript 报错
    Expected Result: 正确的 API 调用通过类型检查，错误调用被拦截
    Failure Indicators: 错误调用不报错（类型不安全）
    Evidence: .sisyphus/evidence/task-6-type-safety.txt

  Scenario: preload 不暴露底层 API
    Tool: Bash
    Preconditions: preload 脚本已更新
    Steps:
      1. 在 src/preload/index.ts 中搜索 ipcRenderer（除了 import 和 electronAPI 封装外不应直接暴露）
      2. 确认 contextBridge.exposeInMainWorld 只暴露自定义 API 对象
    Expected Result: ipcRenderer 不被直接暴露给 renderer
    Failure Indicators: ipcRenderer 被直接暴露
    Evidence: .sisyphus/evidence/task-6-preload-safety.txt
  ```

  **Commit**: YES
  - Message: `feat(ipc): implement typed IPC communication layer`
  - Files: `src/shared/types/index.ts`, `src/main/ipc/index.ts`, `src/preload/index.ts`, `src/preload/index.d.ts`, `src/renderer/src/composables/useElectron.ts`
  - Pre-commit: `npx vue-tsc --noEmit`

- [x] 7. SQLite 数据层

  **What to do**:
  - 创建 `src/main/database/index.ts` — 数据库服务类：
    ```typescript
    class DatabaseService {
      private db: Database
      constructor(dbPath: string) // 初始化连接
      initialize(): void // 创建表（app_settings）
      getSetting(key: string): string | null
      setSetting(key: string, value: string): void
      close(): void // 关闭连接
    }
    ```
  - 数据库文件位置：`app.getPath('userData')/app.db`
  - 启用 WAL 模式：`db.pragma('journal_mode = WAL')`
  - 创建 `app_settings` 表：`CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`
  - 在主进程入口 `src/main/index.ts` 中初始化数据库
  - 注册 IPC 处理器：`get-setting`, `set-setting`
  - 添加 `PRAGMA user_version` 检查（为未来 migration 做准备）
  - 在 app `will-quit` 事件中关闭数据库连接

  **Must NOT do**:
  - 不创建 ORM 或 repository 模式
  - 不创建 migration 框架
  - 不创建除 app_settings 以外的表
  - 不在 preload 或 renderer 中导入 better-sqlite3
  - 不使用异步数据库操作（better-sqlite3 是同步的）

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 需要正确集成 native 模块和 Electron 主进程
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 Tasks 6, 8, 9, 10 并行）
  - **Parallel Group**: Wave 2 (with Tasks 6, 8, 9, 10)
  - **Blocks**: Tasks 15, 16
  - **Blocked By**: Tasks 2, 5

  **References**:

  **External References**:
  - better-sqlite3 API: https://github.com/WiseLibs/better-sqlite3/wiki/API — 所有 API 方法
  - better-sqlite3 性能优化: https://github.com/WiseLibs/better-sqlite3/wiki/Performance — WAL 模式和 pragma 优化
  - Electron app.getPath: https://www.electronjs.org/docs/latest/api/app#appgetpathname — userData 路径

  **WHY Each Reference Matters**:
  - better-sqlite3 API：确认正确的 API 使用方式（prepare, run, get 等）
  - WAL 模式：数据库并发性能优化
  - app.getPath：确认数据库文件的正确存储位置

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 数据库初始化成功
    Tool: Bash
    Preconditions: 应用可启动
    Steps:
      1. 在主进程入口添加：数据库初始化后 console.log('Database initialized')
      2. 运行 `npm run dev`（后台，等 10 秒）
      3. 检查控制台输出包含 "Database initialized"
      4. 停止应用
    Expected Result: 数据库初始化成功，无 native 模块加载错误
    Failure Indicators: "Cannot find module better-sqlite3" 或其他 native 模块错误
    Evidence: .sisyphus/evidence/task-7-db-init.txt

  Scenario: app_settings 表可读写
    Tool: Bash
    Preconditions: 数据库已初始化
    Steps:
      1. 通过 IPC 调用 setSetting('test_key', 'test_value')
      2. 通过 IPC 调用 getSetting('test_key')
      3. 验证返回值为 'test_value'
      4. 调用 getSetting('nonexistent') 返回 null
    Expected Result: 设置读写正确，不存在 key 返回 null
    Failure Indicators: 读写失败或返回值不匹配
    Evidence: .sisyphus/evidence/task-7-db-settings.txt

  Scenario: WAL 模式已启用
    Tool: Bash
    Preconditions: 数据库已初始化
    Steps:
      1. 在 DatabaseService 初始化后执行 db.pragma('journal_mode') 并打印结果
      2. 检查输出为 'wal'
    Expected Result: journal_mode 为 'wal'
    Failure Indicators: journal_mode 为 'delete' 或其他值
    Evidence: .sisyphus/evidence/task-7-db-wal.txt
  ```

  **Commit**: YES
  - Message: `feat(db): add SQLite data layer with better-sqlite3`
  - Files: `src/main/database/index.ts`, `src/main/ipc/index.ts`, `src/main/index.ts`
  - Pre-commit: `npm run build`

- [x] 8. Vue Router 路由配置

  **What to do**:
  - 创建 `src/renderer/src/router/index.ts`：
    - 使用 `createWebHashHistory()`（Electron 必需 Hash 模式）
    - 定义路由：`/` (Home), `/settings` (Settings)
    - 使用懒加载：`() => import('@/views/Settings.vue')`
  - 在 `src/renderer/src/main.ts` 中注册 router
  - 创建 `src/renderer/src/views/Home.vue` — 简单首页组件
  - 创建 `src/renderer/src/views/Settings.vue` — 简单设置页组件（显示 app_settings 内容）
  - 验证路由导航正常工作

  **Must NOT do**:
  - 不使用 `createWebHistory()`（HTML5 模式不适合 Electron）
  - 不添加路由守卫
  - 不添加嵌套路由
  - 不使用 Vue Router 5.x

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 标准 Vue Router 配置
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 Tasks 6, 7, 9, 10 并行）
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 9, 10)
  - **Blocks**: Tasks 16, 18
  - **Blocked By**: Task 5

  **References**:

  **External References**:
  - Vue Router 4.x Hash Mode: https://router.vuejs.org/guide/essentials/history-mode#hash-mode — createWebHashHistory 用法
  - Vue Router 4.x 安装: https://router.vuejs.org/installation.html — Vue 3 安装方式

  **WHY Each Reference Matters**:
  - Hash Mode 文档：确认 Electron 环境下必须使用 Hash 模式
  - 安装指南：确认 Vue Router 4.x 的正确安装和注册方式

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 路由导航正常
    Tool: Bash
    Preconditions: 应用可启动
    Steps:
      1. 运行 `npm run build` 确认编译通过
      2. 检查 renderer 输出中包含路由相关代码
      3. 确认 tsconfig.web.json 中 vue-router 类型正确
    Expected Result: 构建成功，无路由相关错误
    Failure Indicators: 构建失败或路由类型错误
    Evidence: .sisyphus/evidence/task-8-router.txt

  Scenario: Hash 模式确认
    Tool: Bash
    Preconditions: router/index.ts 已创建
    Steps:
      1. 检查 router/index.ts 使用 createWebHashHistory()
      2. 确认没有使用 createWebHistory()
    Expected Result: 使用 createWebHashHistory
    Failure Indicators: 使用了 createWebHistory
    Evidence: .sisyphus/evidence/task-8-hash-mode.txt
  ```

  **Commit**: YES
  - Message: `feat(router): configure Vue Router with hash mode`
  - Files: `src/renderer/src/router/index.ts`, `src/renderer/src/views/Home.vue`, `src/renderer/src/views/Settings.vue`, `src/renderer/src/main.ts`
  - Pre-commit: `npx vue-tsc --noEmit`

- [ ] 9. Pinia 状态管理

  **What to do**:
  - 创建 `src/renderer/src/stores/app.ts` — 应用级 Store：

    ```typescript
    // 使用 Setup API（非 Options API）
    export const useAppStore = defineStore('app', () => {
      const appName = ref('AI Desktop')
      const version = ref('0.1.0')
      const isInitialized = ref(false)

      async function initialize() {
        // 通过 IPC 获取应用信息
        isInitialized.value = true
      }

      return { appName, version, isInitialized, initialize }
    })
    ```

  - 在 `src/renderer/src/main.ts` 中注册 Pinia
  - 在 App.vue 的 setup 中调用 store.initialize()
  - 验证 store 在组件中可正确使用

  **Must NOT do**:
  - 不使用 Pinia 3.x（使用 2.x）
  - 不使用 Options API 风格的 store（使用 Setup API）
  - 不创建过多的 store（一个 app store 足够）
  - 不在 store 中直接使用 better-sqlite3

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 标准 Pinia 配置
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 Tasks 6, 7, 8, 10 并行）
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 8, 10)
  - **Blocks**: Tasks 16, 18
  - **Blocked By**: Task 5

  **References**:

  **External References**:
  - Pinia Setup Stores: https://pinia.vuejs.org/core-concepts/#setup-stores — Setup API 用法
  - Pinia 安装: https://pinia.vuejs.org/getting-started.html — Vue 3 安装方式

  **WHY Each Reference Matters**:
  - Setup Stores 文档：确认 Setup API 的正确用法（ref, computed, function）
  - 安装指南：确认 Pinia 2.x 的注册方式

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Pinia store 正常工作
    Tool: Bash
    Preconditions: Pinia 已配置
    Steps:
      1. 运行 `npx vue-tsc --noEmit` 确认类型正确
      2. 运行 `npm run build` 确认构建通过
    Expected Result: TypeScript 检查通过，构建成功
    Failure Indicators: 类型错误或构建失败
    Evidence: .sisyphus/evidence/task-9-pinia.txt

  Scenario: 使用 Setup API 模式
    Tool: Bash
    Preconditions: store 已创建
    Steps:
      1. 检查 src/renderer/src/stores/app.ts 使用 defineStore('app', () => { ... }) 模式
      2. 确认使用 ref() 而非 state: {}
      3. 确认使用函数而非 actions: {}
    Expected Result: 使用 Setup API 模式
    Failure Indicators: 使用 Options API 模式（state/actions/getters）
    Evidence: .sisyphus/evidence/task-9-setup-api.txt
  ```

  **Commit**: YES
  - Message: `feat(store): configure Pinia state management`
  - Files: `src/renderer/src/stores/app.ts`, `src/renderer/src/main.ts`, `src/renderer/src/App.vue`
  - Pre-commit: `npx vue-tsc --noEmit`

- [ ] 10. TailwindCSS v4 + 基础 UI 布局

  **What to do**:
  - 更新 `electron.vite.config.ts` renderer 配置，添加 `@tailwindcss/vite` 插件
  - 创建 `src/renderer/src/assets/main.css`：
    ```css
    @import 'tailwindcss';
    ```
  - 在 `src/renderer/src/main.ts` 中导入 `./assets/main.css`
  - 创建 `src/renderer/src/components/layout/AppLayout.vue` — 应用布局外壳：
    - 左侧固定宽度侧边栏（200px，深色背景）
    - 右侧自适应内容区
    - 使用 TailwindCSS v4 的 utility classes
  - 创建 `src/renderer/src/components/layout/AppSidebar.vue` — 侧边栏组件：
    - 应用 Logo/名称
    - 导航链接（Home, Settings）使用 `<router-link>`
    - 当前路由高亮（router-link-active）
  - 更新 `src/renderer/src/App.vue` 使用 AppLayout
  - 验证 UI 在 Electron 窗口中正确显示

  **Must NOT do**:
  - 不创建自定义设计 token 或 theme 系统
  - 不创建可复用 UI 组件库（Button, Input 等）
  - 不添加动画或过渡效果
  - 不使用 TailwindCSS v3 或创建 tailwind.config.js
  - 不添加响应式断点（桌面应用不需要）

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI 布局和样式工作
  - **Skills**: [`/frontend-ui-ux`]
    - `/frontend-ui-ux`: 前端 UI/UX 布局设计

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 Tasks 6, 7, 8, 9 并行）
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 8, 9)
  - **Blocks**: Tasks 12, 16, 18
  - **Blocked By**: Task 5

  **References**:

  **External References**:
  - TailwindCSS v4 Vite 安装: https://tailwindcss.com/docs/installation/vite — @tailwindcss/vite 插件用法
  - TailwindCSS v4 新特性: https://tailwindcss.com/blog/tailwindcss-v4 — v4 的变化

  **WHY Each Reference Matters**:
  - Vite 插件安装：确认 TailwindCSS v4 的正确 Vite 集成方式
  - v4 新特性：了解 v4 和 v3 的区别，不使用 v3 的配置方式

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: TailwindCSS 样式生效
    Tool: Playwright
    Preconditions: 应用可启动
    Steps:
      1. 启动应用 npm run dev
      2. 使用 Playwright 打开应用窗口
      3. 检查侧边栏元素是否存在
      4. 检查 TailwindCSS 类名是否应用（检查 computed style）
    Expected Result: 侧边栏可见，样式正确应用
    Failure Indicators: 元素存在但无样式（TailwindCSS 未加载）
    Evidence: .sisyphus/evidence/task-10-ui-screenshot.png

  Scenario: 路由导航在侧边栏工作
    Tool: Playwright
    Preconditions: 路由和侧边栏都已配置
    Steps:
      1. 启动应用
      2. 点击侧边栏 "Settings" 链接
      3. 检查 URL hash 变为 #/settings
      4. 检查内容区显示 Settings 组件
      5. 点击 "Home" 链接
      6. 检查 URL hash 变为 #/
    Expected Result: 路由导航正常，侧边栏高亮正确
    Failure Indicators: URL 不变或内容区不更新
    Evidence: .sisyphus/evidence/task-10-navigation.png

  Scenario: 无 tailwind.config.js 文件
    Tool: Bash
    Preconditions: TailwindCSS v4 已配置
    Steps:
      1. 检查项目根目录不存在 tailwind.config.js 或 tailwind.config.ts
    Expected Result: 不存在 tailwind.config 文件（v4 不需要）
    Failure Indicators: 存在 tailwind.config 文件
    Evidence: .sisyphus/evidence/task-10-no-config.txt
  ```

  **Commit**: YES
  - Message: `feat(ui): add TailwindCSS v4 and base layout shell`
  - Files: `electron.vite.config.ts`, `src/renderer/src/assets/main.css`, `src/renderer/src/components/layout/AppLayout.vue`, `src/renderer/src/components/layout/AppSidebar.vue`, `src/renderer/src/App.vue`, `src/renderer/src/main.ts`
  - Pre-commit: `npm run build`

- [ ] 11. 系统托盘 + 单实例锁

  **What to do**:
  - 创建 `src/main/tray.ts` — 系统托盘模块：
    - 创建 Tray 实例（使用脚手架自带的 icon.png 作为托盘图标）
    - 设置托盘 tooltip 为应用名
    - 创建上下文菜单：显示/隐藏窗口、检查更新、退出
    - 实现点击托盘图标切换窗口显示/隐藏
    - 实现 macOS dock 点击行为（app.on('activate')）
  - 在 `src/main/index.ts` 中集成单实例锁：
    ```typescript
    const gotTheLock = app.requestSingleInstanceLock()
    if (!gotTheLock) {
      app.quit()
    } else {
      app.on('second-instance', () => {
        // 聚焦已有窗口
      })
    }
    ```
  - 实现关闭窗口最小化到托盘（而非退出应用）
    - Windows: 关闭按钮 → 隐藏窗口
    - macOS: 关闭窗口不退出（标准行为）
  - 托盘菜单"退出"才真正退出应用

  **Must NOT do**:
  - 不实现托盘通知或气泡提示
  - 不自定义托盘图标（使用脚手架默认图标）
  - 不实现托盘右键菜单的自定义 UI

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 需要处理跨平台差异（macOS vs Windows）
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 Task 12, 14, 15 部分并行）
  - **Parallel Group**: Wave 3
  - **Blocks**: Tasks 13, 14
  - **Blocked By**: Task 6

  **References**:

  **External References**:
  - Electron Tray API: https://www.electronjs.org/docs/latest/api/tray — Tray 类用法
  - Electron Menu: https://www.electronjs.org/docs/latest/api/menu — Menu.buildFromTemplate
  - Electron app.requestSingleInstanceLock: https://www.electronjs.org/docs/latest/api/app#apprequestsingleinstancelock — 单实例锁

  **WHY Each Reference Matters**:
  - Tray API：托盘图标和菜单创建
  - requestSingleInstanceLock：防止多实例运行

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 单实例锁工作
    Tool: Bash
    Preconditions: 应用已构建
    Steps:
      1. 启动应用（npm run dev 后台）
      2. 再次运行 npm run dev（第二个实例）
      3. 检查第二个实例自动退出
      4. 检查第一个实例仍在运行
    Expected Result: 第二个实例退出，第一个实例获焦
    Failure Indicators: 两个实例同时运行
    Evidence: .sisyphus/evidence/task-11-single-instance.txt

  Scenario: 关闭窗口最小化到托盘
    Tool: Bash
    Preconditions: 应用已启动，系统托盘已创建
    Steps:
      1. 启动应用
      2. 关闭主窗口（点击 X）
      3. 检查 app 进程仍在运行（pgrep -f electron）
      4. 通过 IPC 模拟托盘点击
    Expected Result: 进程未退出，窗口隐藏
    Failure Indicators: 进程已退出
    Evidence: .sisyphus/evidence/task-11-tray-minimize.txt

  Scenario: 托盘菜单退出功能
    Tool: Bash
    Preconditions: 托盘已创建
    Steps:
      1. 验证 tray.ts 中创建的菜单包含"退出"选项
      2. 确认退出调用 app.quit()
    Expected Result: 菜单包含退出选项并正确退出
    Failure Indicators: 无退出选项或退出不调用 app.quit()
    Evidence: .sisyphus/evidence/task-11-tray-exit.txt
  ```

  **Commit**: YES
  - Message: `feat(tray): add system tray and single instance lock`
  - Files: `src/main/tray.ts`, `src/main/index.ts`
  - Pre-commit: `npm run build`

- [ ] 12. 多窗口管理

  **What to do**:
  - 创建 `src/main/windows/index.ts` — 窗口管理模块：
    ```typescript
    export function createMainWindow(): BrowserWindow // 主窗口（800x600）
    export function createSettingsWindow(): BrowserWindow // 设置窗口（600x500，独立）
    export function createAboutWindow(): BrowserWindow // 关于窗口（400x300，模态）
    ```
  - 每个窗口使用独立的 preload 脚本
  - 窗口管理：跟踪已打开窗口，防止重复打开
  - 主窗口关闭行为：隐藏到托盘（由 Task 11 处理）
  - 设置窗口：独立窗口，可同时显示
  - 关于窗口：模态（依附于主窗口，parent 设置）
  - 添加 IPC 处理器：`open-settings`, `open-about`
  - 更新侧边栏添加设置入口（齿轮图标链接到 /settings）

  **Must NOT do**:
  - 不创建通用窗口管理框架/工厂模式
  - 不实现窗口间通信（除 IPC 外）
  - 不实现窗口状态持久化（位置/大小记忆）
  - 不为每个窗口使用不同的 HTML 入口

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Electron 窗口管理需要跨平台考虑
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 Tasks 13, 14, 15 并行）
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 18
  - **Blocked By**: Tasks 6, 10

  **References**:

  **External References**:
  - Electron BrowserWindow: https://www.electronjs.org/docs/latest/api/browser-window — 窗口选项
  - Electron 多窗口模式: https://www.electronjs.org/docs/latest/tutorial/multiple-windows — 多窗口管理

  **WHY Each Reference Matters**:
  - BrowserWindow API：窗口创建选项（大小、位置、parent、modal 等）
  - 多窗口教程：Electron 官方多窗口最佳实践

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 多窗口可创建
    Tool: Bash
    Preconditions: 应用已构建
    Steps:
      1. 运行 `npm run build` 确认编译通过
      2. 检查 windows/index.ts 包含 createMainWindow, createSettingsWindow, createAboutWindow
    Expected Result: 构建成功，三个窗口创建函数存在
    Failure Indicators: 构建失败或缺少函数
    Evidence: .sisyphus/evidence/task-12-multi-window.txt

  Scenario: 关于窗口是模态的
    Tool: Bash
    Preconditions: 窗口管理代码已创建
    Steps:
      1. 检查 createAboutWindow 中 BrowserWindow 选项包含 parent 和 modal: true
    Expected Result: 关于窗口设置了 parent 和 modal 属性
    Failure Indicators: 缺少 parent 或 modal 属性
    Evidence: .sisyphus/evidence/task-12-about-modal.txt

  Scenario: 防止重复打开窗口
    Tool: Bash
    Preconditions: 窗口管理代码已创建
    Steps:
      1. 检查 windows/index.ts 中维护了窗口引用
      2. 确认重复调用 createSettingsWindow 时聚焦已有窗口而非创建新的
    Expected Result: 检查到已有窗口实例时复用
    Failure Indicators: 每次调用都创建新窗口
    Evidence: .sisyphus/evidence/task-12-no-duplicate.txt
  ```

  **Commit**: YES
  - Message: `feat(windows): implement multi-window management`
  - Files: `src/main/windows/index.ts`, `src/main/ipc/index.ts`, `src/renderer/src/components/layout/AppSidebar.vue`
  - Pre-commit: `npm run build`

- [ ] 13. 全局快捷键

  **What to do**:
  - 创建 `src/main/hotkey.ts` — 全局快捷键模块：
    - 注册一个快捷键：`CmdOrCtrl+Shift+A` 显示/隐藏主窗口
    - 使用 `globalShortcut.register` API
    - 在应用退出时注销所有快捷键（`globalShortcut.unregisterAll()`）
  - 在 `src/main/index.ts` 中集成快捷键注册
  - 处理快捷键冲突（如果注册失败，log 警告但不崩溃）

  **Must NOT do**:
  - 不实现快捷键配置 UI
  - 不注册过多快捷键（仅一个）
  - 不使用 electron-builder 的 shortcuts 配置

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 简单的 globalShortcut 注册
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 Tasks 12, 14, 15 并行）
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 18
  - **Blocked By**: Task 11

  **References**:

  **External References**:
  - Electron globalShortcut: https://www.electronjs.org/docs/latest/api/global-shortcut — 全局快捷键 API
  - Electron 快捷键加速器: https://www.electronjs.org/docs/latest/api/accelerator — 加速器格式

  **WHY Each Reference Matters**:
  - globalShortcut API：注册和注销全局快捷键
  - Accelerator 格式：快捷键字符串格式（CmdOrCtrl 等）

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 快捷键注册成功
    Tool: Bash
    Preconditions: 应用已构建
    Steps:
      1. 检查 hotkey.ts 中注册了 'CmdOrCtrl+Shift+A'
      2. 确认注册失败时有错误处理（不崩溃）
      3. 确认 app quit 时调用 globalShortcut.unregisterAll()
    Expected Result: 快捷键注册逻辑完整，有错误处理
    Failure Indicators: 缺少错误处理或缺少退出时清理
    Evidence: .sisyphus/evidence/task-13-hotkey.txt
  ```

  **Commit**: YES
  - Message: `feat(hotkey): register global hotkey`
  - Files: `src/main/hotkey.ts`, `src/main/index.ts`
  - Pre-commit: `npm run build`

- [ ] 14. 自动更新 + electron-builder 打包

  **What to do**:
  - 创建 `src/main/updater.ts` — 自动更新模块：
    - 使用 electron-updater 的 `autoUpdater`
    - 实现基本的 `checkForUpdatesAndNotify()`
    - 仅在托盘菜单中添加"检查更新"选项
    - 不实现更新 UI（使用系统通知）
  - 配置 `electron-builder.yml`：
    ```yaml
    appId: com.ai-desktop.app
    productName: AI Desktop
    directories:
      buildResources: build
      output: dist
    asarUnpack:
      - '**/*.node'
      - node_modules/better-sqlite3/**
    mac:
      category: public.app-category.productivity
      target: dmg
    win:
      target: nsis
    ```
  - 确保 `resources/` 目录有默认图标（icon.png）
  - 验证 `npm run build` 后 `npm run build:mac` / `npm run build:win` 可生成安装包
  - 添加 publish 配置为 generic（占位，后续配置具体源）

  **Must NOT do**:
  - 不实现更新 UI（进度条、changelog 等）
  - 不配置代码签名
  - 不配置 GitHub Releases 自动发布
  - 不实现增量更新

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: electron-builder 配置复杂，需要处理 native 模块打包
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 Tasks 12, 13, 15 并行）
  - **Parallel Group**: Wave 3
  - **Blocks**: Tasks 17, 18
  - **Blocked By**: Tasks 2, 11

  **References**:

  **Pattern References**:
  - 脚手架生成的 `electron-builder.yml` — 基础打包配置
  - 脚手架 `resources/` 目录 — 默认图标

  **External References**:
  - electron-builder 配置: https://www.electron.build/configuration/configuration — 配置选项
  - electron-updater: https://www.electron.build/auto-update — 自动更新设置
  - electron-builder asarUnpack: https://www.electron.build/configuration/configuration#asarunpack — 原生模块解包

  **WHY Each Reference Matters**:
  - electron-builder 配置：完整打包配置选项
  - asarUnpack：better-sqlite3 原生模块必须解包
  - electron-updater：自动更新实现方式

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: electron-builder 配置正确
    Tool: Bash
    Preconditions: electron-builder.yml 已配置
    Steps:
      1. 检查 electron-builder.yml 包含 appId, productName
      2. 检查 asarUnpack 包含 better-sqlite3
      3. 检查 mac 和 win 目标配置存在
    Expected Result: 配置完整
    Failure Indicators: 缺少必要配置项
    Evidence: .sisyphus/evidence/task-14-builder-config.txt

  Scenario: macOS 打包成功（仅 macOS 上运行）
    Tool: Bash
    Preconditions: 配置完成
    Steps:
      1. 运行 `npm run build`
      2. 运行 `npx electron-builder --mac`
      3. 检查 dist/ 目录下生成 .dmg 文件
    Expected Result: dist/ 目录包含 .dmg 文件
    Failure Indicators: 打包失败或无 .dmg 文件
    Evidence: .sisyphus/evidence/task-14-build-mac.txt

  Scenario: 自动更新模块存在
    Tool: Bash
    Preconditions: updater.ts 已创建
    Steps:
      1. 检查 updater.ts 导出 checkForUpdates 函数
      2. 确认使用 electron-updater 的 autoUpdater
    Expected Result: 自动更新模块存在且使用正确的 API
    Failure Indicators: 缺少模块或使用废弃 API
    Evidence: .sisyphus/evidence/task-14-updater.txt
  ```

  **Commit**: YES
  - Message: `feat(update): add auto-update + electron-builder packaging`
  - Files: `src/main/updater.ts`, `electron-builder.yml`, `src/main/tray.ts`
  - Pre-commit: `npm run build`

- [ ] 15. 异常处理 + CSP 安全策略

  **What to do**:
  - 在 `src/main/index.ts` 中添加全局异常处理：
    ```typescript
    process.on('uncaughtException', (error) => {
      /* log and handle */
    })
    process.on('unhandledRejection', (reason) => {
      /* log and handle */
    })
    ```
  - 在 webContents 上添加崩溃处理：
    ```typescript
    mainWindow.webContents.on('crashed', () => {
      /* handle */
    })
    mainWindow.webContents.on('render-process-gone', () => {
      /* handle */
    })
    ```
  - 在 index.html 中添加基础 CSP meta 标签：
    ```html
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
    />
    ```
  - 添加 DevTools 生产环境保护（生产环境禁用或需要快捷键触发）

  **Must NOT do**:
  - 不实现崩溃报告服务
  - 不添加过于严格的 CSP（阻塞必要的内联样式）
  - 不实现自动恢复机制

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 标准的异常处理和 CSP 配置
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 Tasks 12, 13, 14 并行）
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 18
  - **Blocked By**: Tasks 6, 7

  **References**:

  **External References**:
  - Electron 安全检查清单: https://www.electronjs.org/docs/latest/tutorial/security — 安全最佳实践
  - Content Security Policy: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP — CSP 配置

  **WHY Each Reference Matters**:
  - Electron 安全检查清单：桌面应用的安全基线
  - CSP 文档：正确的 CSP 配置语法

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 全局异常处理存在
    Tool: Bash
    Preconditions: main/index.ts 已更新
    Steps:
      1. 检查 main/index.ts 包含 uncaughtException 处理
      2. 检查 main/index.ts 包含 unhandledRejection 处理
    Expected Result: 两个异常处理都存在
    Failure Indicators: 缺少任一处理
    Evidence: .sisyphus/evidence/task-15-error-handling.txt

  Scenario: CSP meta 标签存在
    Tool: Bash
    Preconditions: index.html 已更新
    Steps:
      1. 检查 src/renderer/index.html 包含 Content-Security-Policy meta 标签
      2. 确认至少包含 default-src 'self'
    Expected Result: CSP 标签存在且包含基本安全策略
    Failure Indicators: 缺少 CSP 标签
    Evidence: .sisyphus/evidence/task-15-csp.txt
  ```

  **Commit**: YES
  - Message: `feat(safety): add error handling and CSP policy`
  - Files: `src/main/index.ts`, `src/renderer/index.html`
  - Pre-commit: `npm run build`

- [ ] 16. Vitest 测试基础设施 + 示例测试

  **What to do**:
  - 创建 `vitest.config.ts`（或 vitest.workspace.ts）：

    ```typescript
    import vue from '@vitejs/plugin-vue'
    import { defineConfig } from 'vitest/config'

    export default defineConfig({
      plugins: [vue()],
      test: {
        environment: 'happy-dom',
        include: ['src/**/*.test.ts'],
        coverage: {
          provider: 'v8',
          reporter: ['text', 'json', 'html'],
        },
      },
    })
    ```

  - 创建 `src/renderer/src/stores/__tests__/app.test.ts` — Pinia store 单元测试
  - 创建 `src/renderer/src/composables/__tests__/useElectron.test.ts` — composable 测试
  - 创建 `src/main/database/__tests__/database.test.ts` — SQLite 操作测试（使用临时数据库）
  - 添加 npm scripts: `test`, `test:unit`, `test:coverage`
  - 验证 `npx vitest run` 通过

  **Must NOT do**:
  - 不编写大量测试用例（每个文件 1-3 个测试即可）
  - 不 mock 整个 Electron API（只 mock 必要部分）
  - 不追求高覆盖率

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 需要理解 Vitest 配置和 Electron 测试模式
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 Task 17 并行）
  - **Parallel Group**: Wave 4 (with Task 17)
  - **Blocks**: Task 18
  - **Blocked By**: Tasks 5-10

  **References**:

  **External References**:
  - Vitest 配置: https://vitest.dev/config/ — Vitest 配置选项
  - Vue Test Utils: https://test-utils.vuejs.org/ — Vue 组件测试工具
  - Vitest Vue 指南: https://vitest.dev/guide/ — 基础使用

  **WHY Each Reference Matters**:
  - Vitest 配置：确认正确的配置格式
  - Vue Test Utils：Vue 组件测试方法

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Vitest 测试通过
    Tool: Bash
    Preconditions: 测试文件已创建
    Steps:
      1. 运行 `npx vitest run`
      2. 检查退出码为 0
      3. 检查至少 3 个测试通过
    Expected Result: 所有测试通过，退出码 0
    Failure Indicators: 退出码非 0 或测试失败
    Evidence: .sisyphus/evidence/task-16-vitest.txt

  Scenario: 数据库测试使用临时文件
    Tool: Bash
    Preconditions: database.test.ts 已创建
    Steps:
      1. 检查测试文件使用 os.tmpdir() 创建临时数据库
      2. 检查 afterEach 中关闭并删除临时数据库
    Expected Result: 测试使用临时数据库，不污染生产数据
    Failure Indicators: 使用生产数据库路径
    Evidence: .sisyphus/evidence/task-16-db-test.txt
  ```

  **Commit**: YES
  - Message: `test(unit): set up Vitest with example tests`
  - Files: `vitest.config.ts`, `src/**/*.test.ts`, `package.json`
  - Pre-commit: `npx vitest run`

- [ ] 17. Playwright E2E 测试基础设施

  **What to do**:
  - 创建 `playwright.config.ts`：

    ```typescript
    import { defineConfig } from '@playwright/test'

    export default defineConfig({
      testDir: './e2e',
      timeout: 30000,
      retries: 0,
      use: {
        trace: 'on-first-retry',
      },
    })
    ```

  - 创建 `e2e/app.spec.ts` — 基础 E2E 测试：
    - 测试应用启动（使用 @playwright/electron 的 \_electron.launch）
    - 测试窗口可见性
    - 测试基础 UI 渲染
  - 创建 `e2e/helpers.ts` — 测试辅助工具（启动应用、获取窗口等）
  - 添加 npm scripts: `test:e2e`
  - 验证 `npx playwright test` 通过

  **Must NOT do**:
  - 不编写全面的 E2E 测试套件（仅 1-2 个冒烟测试）
  - 不 mock Electron API
  - 不配置 CI 环境的测试

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Playwright + Electron 集成需要特殊配置
  - **Skills**: [`/playwright`]
    - `/playwright`: 浏览器自动化测试

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 Task 16 并行）
  - **Parallel Group**: Wave 4 (with Task 16)
  - **Blocks**: Task 18
  - **Blocked By**: Task 14

  **References**:

  **External References**:
  - Playwright Electron: https://playwright.dev/docs/api/class-electron — Playwright Electron 测试
  - @playwright/electron npm: https://www.npmjs.com/package/@playwright/electron — 安装和使用

  **WHY Each Reference Matters**:
  - Playwright Electron API：Electron 应用测试方式
  - @playwright/electron：正确安装和导入方式

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Playwright 测试通过
    Tool: Bash
    Preconditions: E2E 测试已创建
    Steps:
      1. 先运行 `npm run build` 构建应用
      2. 运行 `npx playwright test`
      3. 检查退出码为 0
    Expected Result: 测试通过，应用可启动
    Failure Indicators: 退出码非 0 或应用无法启动
    Evidence: .sisyphus/evidence/task-17-playwright.txt

  Scenario: 测试使用构建输出
    Tool: Bash
    Preconditions: E2E 测试已创建
    Steps:
      1. 检查 e2e/helpers.ts 中 _electron.launch 指向 out/main/index.js
    Expected Result: 启动已构建的应用进行测试
    Failure Indicators: 指向源码而非构建输出
    Evidence: .sisyphus/evidence/task-17-build-path.txt
  ```

  **Commit**: YES
  - Message: `test(e2e): set up Playwright with E2E test`
  - Files: `playwright.config.ts`, `e2e/app.spec.ts`, `e2e/helpers.ts`, `package.json`
  - Pre-commit: `npx playwright test`

- [ ] 18. 完整构建验证 + 端到端测试

  **What to do**:
  - 执行完整构建流程验证：
    1. `npm run build` — 确认构建成功
    2. `npx vitest run` — 确认单元测试通过
    3. `npx playwright test` — 确认 E2E 测试通过
    4. `npx eslint .` — 确认代码规范检查通过
    5. `npx vue-tsc --noEmit` — 确认类型检查通过
  - 验证 IPC 端到端通信：
    - 创建 `e2e/ipc.spec.ts` — 测试 ping/pong IPC
    - 测试数据库 IPC（getSetting/setSetting）
  - 验证窗口功能：
    - 创建 `e2e/windows.spec.ts` — 测试多窗口创建
  - 验证完整开发工作流：
    - `npm run dev` 启动 → 操作 → 关闭 无错误
  - 修复发现的所有问题

  **Must NOT do**:
  - 不添加新功能（仅验证和修复）
  - 不重构代码

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 全面的构建验证和问题排查
  - **Skills**: [`/playwright`]
    - `/playwright`: E2E 测试验证

  **Parallelization**:
  - **Can Run In Parallel**: NO（依赖所有前置任务）
  - **Parallel Group**: Sequential
  - **Blocks**: Task 20
  - **Blocked By**: Tasks 14, 16, 17

  **References**:

  **Pattern References**:
  - 所有前序任务的输出文件

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 全流程构建验证
    Tool: Bash
    Preconditions: 所有代码已提交
    Steps:
      1. `rm -rf out/ dist/ node_modules/.cache`
      2. `npm run build` → 检查退出码 0
      3. `npx vitest run` → 检查退出码 0
      4. `npx eslint .` → 检查退出码 0
      5. `npx vue-tsc --noEmit` → 检查退出码 0
      6. 检查 out/main/index.js, out/preload/index.js, out/renderer/index.html 存在
    Expected Result: 全部通过，构建产物完整
    Failure Indicators: 任一步骤失败
    Evidence: .sisyphus/evidence/task-18-full-build.txt

  Scenario: E2E 端到端验证
    Tool: Bash + Playwright
    Preconditions: 应用已构建
    Steps:
      1. `npx playwright test` 运行所有 E2E 测试
      2. 验证应用启动、窗口显示、IPC 通信
    Expected Result: 所有 E2E 测试通过
    Failure Indicators: 任一 E2E 测试失败
    Evidence: .sisyphus/evidence/task-18-e2e.txt
  ```

  **Commit**: YES
  - Message: `test(integration): full build verification and E2E testing`
  - Files: `e2e/ipc.spec.ts`, `e2e/windows.spec.ts`, 修复文件
  - Pre-commit: `npx vitest run && npx playwright test`

- [ ] 19. AGENTS.md 知识库生成

  **What to do**:
  - 生成 `/init-deep` 层级的 AGENTS.md 知识库文件
  - 使用 `/init-deep` 命令初始化分层知识库结构
  - 内容应覆盖：
    1. **项目概述**：技术栈、目标平台、核心架构
    2. **目录结构说明**：每个目录的职责
    3. **架构决策**：为什么选择这些技术和配置
    4. **开发指南**：如何启动、构建、测试
    5. **IPC 通信模式**：如何添加新的 IPC 处理器
    6. **数据库使用**：如何操作 SQLite
    7. **添加新功能**：步骤指南
    8. **桌面特性**：窗口管理、托盘、更新
    9. **代码规范**：ESLint + Prettier 规则
    10. **测试指南**：如何写测试
  - AGENTS.md 应简洁实用（目标 200 行以内），避免冗余

  **Must NOT do**:
  - 不过度文档化（不超过 200 行）
  - 不包含 AI 功能相关内容（还未实现）
  - 不生成 API 文档

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: 文档撰写工作
  - **Skills**: [`/init-deep`]
    - `/init-deep`: 分层知识库初始化

  **Parallelization**:
  - **Can Run In Parallel**: YES（与 Task 18 并行）
  - **Parallel Group**: Wave 4 (with Task 18)
  - **Blocks**: Task 20
  - **Blocked By**: Tasks 5-15（需要理解全部代码）

  **References**:

  **Pattern References**:
  - 项目全部代码文件 — 作为文档素材

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: AGENTS.md 文件存在
    Tool: Bash
    Preconditions: 文件已生成
    Steps:
      1. 检查 AGENTS.md 文件存在
      2. 检查文件大小 > 0
      3. 检查文件行数 <= 200
    Expected Result: AGENTS.md 存在，有内容，行数合理
    Failure Indicators: 文件不存在或过大
    Evidence: .sisyphus/evidence/task-19-agents-md.txt

  Scenario: AGENTS.md 包含关键章节
    Tool: Bash
    Preconditions: 文件已生成
    Steps:
      1. 检查包含"技术栈"或"Technology Stack"
      2. 检查包含"目录结构"或"Directory Structure"
      3. 检查包含"开发指南"或"Development Guide"
      4. 检查包含"IPC"或"通信"
      5. 检查包含"测试"或"Testing"
    Expected Result: 包含所有关键章节
    Failure Indicators: 缺少关键章节
    Evidence: .sisyphus/evidence/task-19-content.txt
  ```

  **Commit**: YES
  - Message: `docs: generate AGENTS.md knowledge base`
  - Files: `AGENTS.md` (或 `.sisyphus/AGENTS.md` 层级结构)
  - Pre-commit: 无

- [ ] 20. 清理 + 最终验证

  **What to do**:
  - 删除所有临时/调试代码（console.log 等）
  - 验证 .gitignore 文件完整（忽略 out/, dist/, node_modules/, .sisyphus/evidence/）
  - 运行完整验证套件：
    - `npm run build` ✅
    - `npx vitest run` ✅
    - `npx eslint .` ✅
    - `npx vue-tsc --noEmit` ✅
  - 确认所有任务 evidence 文件已生成
  - 确认 package.json scripts 完整（dev, build, preview, test, test:e2e, lint, typecheck, build:mac, build:win）
  - 最终 git status 检查无遗漏文件

  **Must NOT do**:
  - 不修改任何功能代码
  - 不添加新文件

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 需要全面检查和修复
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (final)
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 18, 19

  **References**:

  **Pattern References**:
  - 所有前序任务的 evidence 文件

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: 最终验证套件通过
    Tool: Bash
    Preconditions: 所有代码已就绪
    Steps:
      1. `npm run build` → 退出码 0
      2. `npx vitest run` → 退出码 0
      3. `npx eslint .` → 退出码 0
      4. `npx vue-tsc --noEmit` → 退出码 0
    Expected Result: 全部通过
    Failure Indicators: 任一失败
    Evidence: .sisyphus/evidence/task-20-final-verify.txt

  Scenario: .gitignore 完整
    Tool: Bash
    Preconditions: .gitignore 已更新
    Steps:
      1. 检查包含 out/
      2. 检查包含 dist/
      3. 检查包含 node_modules/
      4. 检查包含 .sisyphus/evidence/
    Expected Result: 所有必要忽略项存在
    Failure Indicators: 缺少忽略项
    Evidence: .sisyphus/evidence/task-20-gitignore.txt

  Scenario: npm scripts 完整
    Tool: Bash
    Preconditions: package.json 已更新
    Steps:
      1. 检查 scripts 包含: dev, build, preview, test, test:e2e, lint, typecheck
    Expected Result: 所有 scripts 存在
    Failure Indicators: 缺少 script
    Evidence: .sisyphus/evidence/task-20-scripts.txt
  ```

  **Commit**: YES
  - Message: `chore: final cleanup and verification`
  - Files: `.gitignore`, 任何修复文件
  - Pre-commit: `npm run build && npx vitest run`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [ ] F1. **Plan Compliance Audit** — `oracle`
      Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
      Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
      Run `npm run typecheck` + `npx eslint .` + `npx vitest run`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp).
      Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
      Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (features working together, not isolation). Test edge cases: empty state, invalid input, rapid actions. Save to `.sisyphus/evidence/final-qa/`.
      Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
      For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
      Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **Task 1**: `feat(init): scaffold electron-vite project with Vue + TS template`
- **Task 2**: `chore(deps): install additional dependencies with pinned versions`
- **Task 3**: `chore(lint): configure ESLint flat config + Prettier`
- **Task 4**: `chore(ts): optimize TypeScript configuration for Electron`
- **Task 5**: `feat(arch): reorganize directory structure for desktop app architecture`
- **Task 6**: `feat(ipc): implement typed IPC communication layer`
- **Task 7**: `feat(db): add SQLite data layer with better-sqlite3`
- **Task 8**: `feat(router): configure Vue Router with hash mode`
- **Task 9**: `feat(store): configure Pinia state management`
- **Task 10**: `feat(ui): add TailwindCSS v4 and base layout shell`
- **Task 11**: `feat(tray): add system tray and single instance lock`
- **Task 12**: `feat(windows): implement multi-window management`
- **Task 13**: `feat(hotkey): register global hotkey`
- **Task 14**: `feat(update): add auto-update + electron-builder packaging`
- **Task 15**: `feat(safety): add error handling and CSP policy`
- **Task 16**: `test(unit): set up Vitest with example tests`
- **Task 17**: `test(e2e): set up Playwright with E2E test`
- **Task 18**: `test(integration): full build verification and E2E testing`
- **Task 19**: `docs: generate AGENTS.md knowledge base`
- **Task 20**: `chore: final cleanup and verification`

---

## Success Criteria

### Verification Commands

```bash
npm run dev                    # Expected: Electron window opens with Vue app
npm run build                  # Expected: exit code 0, out/ directory created
npm run build:mac              # Expected: .dmg file created in dist/
npm run build:win              # Expected: .exe file created in dist/
npx vitest run                 # Expected: all tests pass
npx playwright test            # Expected: all E2E tests pass
npx eslint .                   # Expected: no errors
npm run typecheck              # Expected: no type errors
```

### Final Checklist

- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
- [ ] AGENTS.md generated
