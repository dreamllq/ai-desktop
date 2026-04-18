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
