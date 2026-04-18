# Learnings

## Task 13: Global Hotkey Registration

- `globalShortcut.register()` returns boolean indicating success; always check it
- `BrowserWindow.getAllWindows()[0]` is the pattern used throughout this codebase for getting main window
- `unregisterAll()` must be called in `will-quit` to clean up OS-level shortcut registration
- `registerHotkeys()` should be called after `createTray()` in `whenReady()` — tray and hotkeys are independent, order doesn't strictly matter

## Task 19: AGENTS.md Knowledge Base Generation

- Read all key source files to verify actual code patterns before writing docs. Package versions, IPC channel names, and method signatures must match reality.
- The project uses a clean 4-layer source structure: main, preload, renderer, shared. Shared types are the single source of truth for IPC contracts.
- All IPC is handle/invoke pattern. No send/on anywhere. This simplifies the mental model for the knowledge base.
- DatabaseService singleton pattern with getInstance() is clean and testable.
- Prettier config is in .prettierrc.yaml (not JSON). ESLint uses flat config (eslint.config.mjs).
- Path aliases are defined in electron.vite.config.ts for build and vitest.config.ts for tests. Both must stay in sync.
