import { ipcMain, app } from 'electron'
import { IPC_CHANNELS } from '@shared/types'
import type { AppInfo } from '@shared/types'

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

  ipcMain.handle(IPC_CHANNELS.GET_SETTING, (_event, _key: string): null => {
    return null
  })

  ipcMain.handle(IPC_CHANNELS.SET_SETTING, (_event, _key: string, _value: string): void => {})
}
