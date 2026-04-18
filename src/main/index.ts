import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createMainWindow } from './windows'
import { registerIpcHandlers } from './ipc'
import { DatabaseService } from './database'
import { createTray } from './tray'
import { registerHotkeys, unregisterAllHotkeys } from './hotkey'

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.electron')

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    registerIpcHandlers()

    DatabaseService.getInstance().initialize()

    const mainWindow = createMainWindow()

    mainWindow.on('close', (event) => {
      if (process.platform === 'win32') {
        event.preventDefault()
        mainWindow.hide()
      }
    })

    createTray()
    registerHotkeys()

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow()
      } else {
        BrowserWindow.getAllWindows()[0].show()
      }
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('will-quit', () => {
    unregisterAllHotkeys()
    DatabaseService.getInstance().close()
  })
}
