# Learnings

## Task 13: Global Hotkey Registration

- `globalShortcut.register()` returns boolean indicating success; always check it
- `BrowserWindow.getAllWindows()[0]` is the pattern used throughout this codebase for getting main window
- `unregisterAll()` must be called in `will-quit` to clean up OS-level shortcut registration
- `registerHotkeys()` should be called after `createTray()` in `whenReady()` — tray and hotkeys are independent, order doesn't strictly matter
