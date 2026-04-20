import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createMainWindow } from './windows'
import { registerIpcHandlers } from './ipc'
import { DatabaseService } from './database'
import { createTray } from './tray'
import { registerHotkeys, unregisterAllHotkeys } from './hotkey'

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason)
})

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

  app.whenReady().then(async () => {
    electronApp.setAppUserModelId('com.electron')

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    DatabaseService.getInstance().initialize()

    await registerIpcHandlers()

    const mainWindow = createMainWindow()

    mainWindow.webContents.on('render-process-gone', (_event, details) => {
      console.error('Render process gone:', details.reason)
    })

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
