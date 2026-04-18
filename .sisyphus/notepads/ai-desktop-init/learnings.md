# Learnings

## 2026-04-18 Session Start

- Project is greenfield: only README.md, LICENSE, .git exist
- Node.js v22.22.2, npm 10.9.7
- Plan specifies electron-vite scaffold as first step
- 4 waves + final verification wave
- Critical path: T1 → T5 → T6 → T11 → T14 → T18 → T20 → F1-F4

## Task 1: Scaffold

- `npm create @quick-start/electron@latest` is highly interactive; `--template vue-ts` does NOT skip prompts
- Must use `expect` with arrow key codes (`\x1b[B` for down, `\x1b[C` for right) to automate selection
- Scaffold path argument is resolved relative to CWD — use workdir to control base directory
- For non-empty dirs, scaffold in temp dir then `rsync --exclude='.git'` to project
- Electron binary download may fail; set `ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"` in China
- Scaffold generates `start` script (not `preview`) for `electron-vite preview` — this is the default convention
- LSP may report false positives on `.vue` imports; `npm run build` (which includes typecheck) is the truth
- Scaffold package name derives from directory name (e.g., `electron-scaffold` from `/tmp/electron-scaffold`)

## Task 2: Dependencies Installation

- better-sqlite3 is a native module requiring `electron-builder install-app-deps` to rebuild for Electron
- `npm install` with electron postinstall can timeout (>5min); use `--ignore-scripts` + manual `npx electron-builder install-app-deps` as fallback
- npm adds `^` by default; must post-process package.json to strip prefixes
- lodash.isequal@4.5.0 is deprecated (comes as transitive dep of electron-updater) - non-blocking
- Installed versions: vue-router 4.6.4, pinia 2.3.1, better-sqlite3 12.9.0, electron-updater 6.8.3, tailwindcss 4.2.2, vitest 4.1.4, @playwright/test 1.59.1

## Task 3: ESLint & Prettier Configuration

- Scaffold-generated eslint.config.mjs already includes Vue flat/recommended, TypeScript, vue-eslint-parser, and prettier config — well structured
- Scaffold .prettierrc.yaml had `trailingComma: none` — plan required `all`, also missing `tabWidth: 2`
- Scaffold .prettierignore had `out`, `dist` but missing `node_modules`
- Changing trailingComma from `none` to `all` triggered 16 prettier/prettier warnings — all auto-fixable
- `npx prettier --write` and `npx eslint --fix` both work for auto-fixing
- eslint.config.mjs and electron.vite.config.ts also got formatted by prettier (not just src/)
- ESLint flat config with `defineConfig` from `eslint/config` is the modern pattern

## Task 4: TypeScript Configuration Verification

- Scaffold already generates correct 3-file tsconfig structure — verification-only task, no fixes needed
- `tsconfig.json` is a solution-style config: `files: []` + `references` to node and web configs
- `tsconfig.node.json` extends `@electron-toolkit/tsconfig/tsconfig.node.json` — provides ESNext module/bundler resolution
- `tsconfig.web.json` extends `@electron-toolkit/tsconfig/tsconfig.web.json` — browser env, no node types
- Path alias `@renderer/*` → `src/renderer/src/*` configured in tsconfig.web.json with `baseUrl: "."`
- `types: ["electron-vite/node"]` in tsconfig.node.json is sufficient (provides Electron + Node type stubs)
- `src/preload/index.d.ts` declares `Window.electron: ElectronAPI` and `Window.api: unknown`
- Typecheck runs in two passes: `tsc` for node config, `vue-tsc` for web config
- Both pass with zero errors on scaffold-generated code

## Task 5: Directory Structure Reorganization

- Extracted `createWindow()` from `src/main/index.ts` → `src/main/windows/index.ts`; function returns `BrowserWindow` for testability
- `?asset` import suffix for icon requires relative path from windows dir: `../../../resources/icon.png?asset`
- `app.requestSingleInstanceLock()` must be called before any app events; if lock fails, `app.quit()` and early return
- Single instance pattern: wrap all app lifecycle in `else` block after lock check
- `second-instance` handler should restore+focus existing window
- IPC handlers moved to `src/main/ipc/index.ts` — original scaffold had `ipcMain.on('ping')` inline in whenReady
- All skeleton files use proper TypeScript types (no `any`) — DatabaseService is singleton pattern
- `vue-router` with `createWebHashHistory()` is correct for Electron (file:// protocol compatible)
- Pinia store with `defineStore('app', { state, actions })` pattern
- Vue SFC skeleton files use `<template>` only — no `<script>` needed for pure presentational stubs
- `useElectron` composable wraps `window.electron.ipcRenderer` with typed interface
- Scaffold files preserved: Versions.vue, electron.svg, wavy-lines.svg, base.css, main.css
- Build passes with zero errors after full restructure

## Task 6: Typed IPC Communication Layer

- Shared types in `src/shared/types/index.ts` — single source of truth for IPC channels, request/response types
- `IPC_CHANNELS` const + `IpcChannel` type derived via `typeof + keyof` pattern — prevents typos in channel names
- `@shared` path alias needed in THREE places: `tsconfig.node.json`, `tsconfig.web.json`, and `electron.vite.config.ts`
- `electron.vite.config.ts` needs `resolve.alias` for ALL THREE config sections (main, preload, renderer) — not just renderer
- `ipcMain.handle` is the correct pattern for request-response IPC; `ipcMain.on` is fire-and-forget (was the old scaffold pattern)
- `ipcMain.handle` handler for void return still needs explicit `(): void => {}` for type safety
- `contextBridge.exposeInMainWorld` can expose any serializable object — typed `CustomAPI` works directly
- Preload uses `ipcRenderer.invoke()` (Promise-based) to call `ipcMain.handle` handlers — natural match
- `window.api` in `index.d.ts` now typed as `CustomAPI` instead of `unknown` — end-to-end type safety
- `useElectron` composable now returns `CustomAPI` directly — no more untyped `send/invoke/on` wrappers
- Settings handlers are placeholders (return null / no-op) — will be connected to DB in Task 7

## Task 7: SQLite Data Layer

- better-sqlite3 requires `@types/better-sqlite3` (v7.6.13) for TypeScript — install as devDependency
- better-sqlite3 is synchronous by design — no async/await needed, all operations return immediately
- Singleton pattern: private constructor + static getInstance() — app.getPath('userData') provides platform-appropriate data dir
- `Database` type from better-sqlite3 is `Database.Database` (namespace pattern) — used as field type annotation
- WAL mode enabled via `this.db.pragma('journal_mode = WAL')` — better for concurrent reads in Electron
- `INSERT OR REPLACE` is SQLite-specific upsert — simpler than separate INSERT/UPDATE logic
- DatabaseService.close() must be called in `app.on('will-quit')` — ensures clean shutdown before process exit
- Database initialized AFTER registerIpcHandlers() — handlers reference DatabaseService.getInstance() so DB must be ready before any IPC call

## Task 8: Vue Router Configuration
- Electron apps MUST use `createWebHashHistory()` — `createWebHistory()` (HTML5 mode) doesn't work in Electron because there's no server to handle fallbacks
- Lazy loading routes via `() => import(...)` keeps initial bundle small
- TypeScript strict mode flags unused variables (TS6133) — only import composables when actually using destructured values
- When adding router, App.vue must be updated to use `<RouterView />` to render route components
- `@renderer` alias maps to `src/renderer/src/` — use it for cross-module imports in routes

## Task 9: Pinia State Management

- Pinia Setup API uses `defineStore('name', () => { ... })` with `ref()` — NOT the `defineStore('name', { state, actions })` Options API pattern
- Pinia must be registered via `app.use(createPinia())` BEFORE router and mount
- Store initialize() can be called directly in `<script setup>` — runs on component mount, no need for onMounted()
- Async initialize() pattern is future-proof for IPC calls even though current implementation is synchronous
- Build passes with zero errors after converting from Options API to Setup API store pattern

## Task 10: TailwindCSS v4 & Base Layout

- TailwindCSS v4 uses `@tailwindcss/vite` plugin — import from `@tailwindcss/vite`, add to renderer plugins array after `vue()`
- CSS entry is just `@import "tailwindcss"` — no `@tailwind` directives, no `@tailwind base/components/utilities`
- No `tailwind.config.js/ts` needed — v4 is zero-config by default
- Replaced all scaffold CSS (base.css imports, electron styles, media queries) with single `@import "tailwindcss"` line
- Tailwind v4 utility classes work immediately in Vue SFC templates — no additional setup
- `router-link-active` class (applied to all ancestor routes) vs `router-link-exact-active` (exact match only) — used both for reliable active styling
- Vue SFC `[&.router-link-active]` syntax works in Tailwind v4 for targeting dynamic classes on same element
- Layout pattern: AppLayout owns flex container + imports AppSidebar, uses `<slot />` for content
- AppLayout uses `w-screen h-screen` for full viewport, `overflow-hidden` on container, `overflow-auto` on content area

## Task 11: System Tray & Enhanced Single Instance Lock

- Tray icon uses `nativeImage.createFromPath()` with `.resize({ width: 16, height: 16 })` for proper tray sizing
- Tray context menu uses `Menu.buildFromTemplate()` — each item needs `label` and optional `click` handler
- `tray.on('click')` for left-click behavior (toggle window); context menu is right-click on Windows/Linux, default on macOS
- Close-to-tray: on Windows (`process.platform === 'win32'`), intercept `close` event with `event.preventDefault()` + `mainWindow.hide()`
- macOS doesn't need close-to-tray — hiding on close is native macOS behavior (window-all-closed doesn't quit on darwin)
- `createTray()` must be called AFTER `createWindow()` — tray menu references existing windows
- Tray `Quit` calls `app.quit()` directly — bypasses the close-to-tray prevention since it's app-level quit
- Enhanced `activate` handler: if windows exist, show the first one; otherwise create new window
- `app.on('will-quit')` still fires when quitting via tray — DatabaseService cleanup is preserved
