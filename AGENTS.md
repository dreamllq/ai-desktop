# AGENTS.md — AI Desktop Knowledge Base

## Project Overview

AI Desktop is an Electron + Vue 3 + TypeScript desktop application built with electron-vite. It follows the three-process Electron architecture with strict contextIsolation.

## Tech Stack

| Layer            | Technology     | Version |
| ---------------- | -------------- | ------- |
| Runtime          | Electron       | 39.2.6  |
| UI Framework     | Vue            | 3.5.25  |
| Language         | TypeScript     | 5.9.3   |
| Build Tool       | electron-vite  | 5.0.0   |
| State Management | Pinia          | 2.3.1   |
| Routing          | Vue Router     | 4.6.4   |
| Styling          | TailwindCSS    | 4.2.2   |
| Database         | better-sqlite3 | 12.9.0  |
| Unit Testing     | Vitest         | 4.1.4   |
| E2E Testing      | Playwright     | 1.59.1  |

All dependency versions are exact (no `^` or `~`).

## Directory Structure

```
src/
  main/            # Electron main process
    index.ts       # App lifecycle, single-instance lock, startup sequence
    ipc/           # IPC handlers (ipcMain.handle)
    database/      # DatabaseService singleton
    windows/       # Window creation (main, settings, about)
    tray.ts        # System tray with context menu
    hotkey.ts      # Global shortcut registration (CmdOrCtrl+Shift+A)
    updater.ts     # Auto-update via electron-updater
  preload/         # Preload scripts (contextBridge)
    index.ts       # Exposes electron API + custom API to renderer
    index.d.ts     # Type declarations for window.api
  renderer/        # Vue 3 application
    src/
      main.ts      # Vue app entry point
      App.vue      # Root component
      components/  # Reusable Vue components
      views/       # Page-level components
      composables/ # Vue composables (renderer-side API calls)
      stores/      # Pinia stores
      router/      # Vue Router config
      assets/      # Static assets
      env.d.ts     # Renderer type declarations
  shared/
    types/         # Shared types (IPC channels, API interfaces)
```

Path aliases: `@renderer` → `src/renderer/src`, `@shared` → `src/shared`

## Development Guide

```bash
npm run dev           # Start dev server with HMR (electron-vite dev)
npm run build         # Typecheck + build (tsc + vue-tsc + electron-vite build)
npm run typecheck     # Run both node and web typecheck
npm run lint          # ESLint (cached)
npm run lint:fix      # ESLint with auto-fix
npm run format        # Prettier format all files
npm run test          # Vitest unit tests
npm run test:watch    # Vitest in watch mode
npm run test:e2e      # Playwright E2E tests
npm run build:mac     # Build and package for macOS
npm run build:win     # Build and package for Windows
npm run build:linux   # Build and package for Linux
```

## IPC Communication

Adding a new IPC channel follows this flow:

1. **Define channel and types** in `src/shared/types/index.ts`:
   - Add a key to the `IPC_CHANNELS` const
   - Add the method signature to the `CustomAPI` interface

2. **Register handler** in `src/main/ipc/index.ts`:
   - Add `ipcMain.handle(IPC_CHANNELS.YOUR_CHANNEL, handler)`

3. **Expose in preload** in `src/preload/index.ts`:
   - Add method to the `api` object calling `ipcRenderer.invoke()`

4. **Use in renderer** via a composable in `src/renderer/src/composables/`:
   - Call `window.api.yourMethod()`

All IPC uses `ipcMain.handle` / `ipcRenderer.invoke` (request-response pattern). No `send/on` pattern is used.

## Database

- `DatabaseService` is a singleton (`DatabaseService.getInstance()`)
- Database file: `{userData}/app.db`
- WAL mode enabled for concurrent read performance
- Default table: `app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`
- `user_version` pragma tracked for future migrations
- Initialized on app ready, closed on `will-quit`

## Desktop Features

| Feature         | Details                                                                    |
| --------------- | -------------------------------------------------------------------------- |
| Single Instance | `app.requestSingleInstanceLock()` prevents duplicate processes             |
| System Tray     | Show/hide window, check updates, quit. Tray icon from `resources/icon.png` |
| Global Hotkey   | `CmdOrCtrl+Shift+A` toggles main window visibility                         |
| Auto Update     | `electron-updater` with `autoDownload: false`                              |
| Multi-Window    | Main, Settings, and About windows                                          |
| Window Close    | On Windows, closing hides to tray instead of quitting                      |

## Code Standards

### ESLint

Flat config (`eslint.config.mjs`) using:

- `@electron-toolkit/eslint-config-ts` (TypeScript recommended)
- `eslint-plugin-vue` (flat/recommended)
- `vue/block-lang` enforces `<script lang="ts">` in Vue files
- `vue/require-default-prop` and `vue/multi-word-component-names` are disabled

### Prettier

```yaml
singleQuote: true
semi: false
tabWidth: 2
printWidth: 100
trailingComma: all
```

## Testing

### Unit Tests (Vitest)

- Config in `vitest.config.ts`
- Environment: `happy-dom`
- Test files: `src/**/*.test.ts`
- Path aliases match the main project config

### E2E Tests (Playwright)

- Config in `playwright.config.ts`
- Test files in `e2e/` directory
- Run with `npm run test:e2e`

## Build Output

- Compiled output goes to `out/` directory
- Main process: `out/main/`
- Preload: `out/preload/`
- Renderer: `out/renderer/`
- Packaging configured in `electron-builder.yml`
