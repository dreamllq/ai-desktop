# Decisions

## 2026-04-18 Session Start
- Using electron-vite official scaffold (npm create @quick-start/electron)
- Electron + Vue 3 + TypeScript stack
- sandbox: false + contextIsolation: true (needed for native modules)
- better-sqlite3 (sync API, 11.7x faster than sql.js)
- TailwindCSS v4 with @tailwindcss/vite plugin (zero config file)
- Vue Router 4.x (Hash Mode), Pinia 2.x (Setup API)
- Precise version pinning (no ^ or ~)
