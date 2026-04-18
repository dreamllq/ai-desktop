import { globalShortcut, BrowserWindow } from 'electron'

export function registerHotkeys(): void {
  const registered = globalShortcut.register('CmdOrCtrl+Shift+A', () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (!win) return
    if (win.isVisible()) {
      win.hide()
    } else {
      win.show()
      win.focus()
    }
  })

  if (!registered) {
    console.warn('Failed to register global shortcut CmdOrCtrl+Shift+A')
  }
}

export function unregisterAllHotkeys(): void {
  globalShortcut.unregisterAll()
}
