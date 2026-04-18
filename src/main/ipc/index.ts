import { ipcMain, app } from 'electron'
import { IPC_CHANNELS } from '@shared/types'
import type { AppInfo } from '@shared/types'
import { DatabaseService } from '../database'

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.PING, () => 'pong')

  ipcMain.handle(IPC_CHANNELS.GET_APP_INFO, (): AppInfo => {
    return {
      name: app.getName(),
      version: app.getVersion(),
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      nodeVersion: process.versions.node,
      platform: process.platform,
    }
  })

  ipcMain.handle(IPC_CHANNELS.GET_SETTING, (_event, key: string): string | null => {
    return DatabaseService.getInstance().getSetting(key)
  })

  ipcMain.handle(IPC_CHANNELS.SET_SETTING, (_event, key: string, value: string): void => {
    DatabaseService.getInstance().setSetting(key, value)
  })
}
