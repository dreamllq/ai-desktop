import { app, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createWindow } from './windows'
import { registerIpcHandlers } from './ipc'
import { DatabaseService } from './database'
import { createTray } from './tray'

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

    const mainWindow = createWindow()

    mainWindow.on('close', (event) => {
      if (process.platform === 'win32') {
        event.preventDefault()
        mainWindow.hide()
      }
    })

    createTray()

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
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
    DatabaseService.getInstance().close()
  })
}
