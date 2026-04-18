import { ipcMain, app, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '@shared/types'
import type { AppInfo, LlmProviderCreate, LlmProviderUpdate } from '@shared/types'
import { DatabaseService } from '../database'
import { createSettingsWindow, createAboutWindow } from '../windows'

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

  ipcMain.handle(IPC_CHANNELS.OPEN_SETTINGS, () => {
    createSettingsWindow()
  })

  ipcMain.handle(IPC_CHANNELS.OPEN_ABOUT, () => {
    const mainWindow = BrowserWindow.getAllWindows()[0]
    if (mainWindow) {
      createAboutWindow(mainWindow)
    }
  })

  // LLM Provider handlers
  ipcMain.handle(IPC_CHANNELS.LLM_LIST_PROVIDERS, () => {
    try {
      const providers = DatabaseService.getInstance().listProviders()
      return { success: true as const, data: providers }
    } catch (error) {
      return { success: false as const, error: String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.LLM_GET_PROVIDER, (_event, id: string) => {
    try {
      const provider = DatabaseService.getInstance().getProviderPublic(id)
      if (!provider) {
        return { success: false as const, error: 'Provider not found' }
      }
      return { success: true as const, data: provider }
    } catch (error) {
      return { success: false as const, error: String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.LLM_CREATE_PROVIDER, (_event, data: LlmProviderCreate) => {
    try {
      if (!data || !data.name || !data.name.trim()) {
        return { success: false as const, error: 'Provider name is required' }
      }
      if (data.baseUrl) {
        try {
          new URL(data.baseUrl)
        } catch {
          return { success: false as const, error: 'Invalid baseUrl format' }
        }
      }
      if (data.timeout !== undefined && (typeof data.timeout !== 'number' || data.timeout <= 0)) {
        return { success: false as const, error: 'Timeout must be a positive number' }
      }
      const id = DatabaseService.getInstance().createProvider(data)
      return { success: true as const, data: id }
    } catch (error) {
      return { success: false as const, error: String(error) }
    }
  })

  ipcMain.handle(
    IPC_CHANNELS.LLM_UPDATE_PROVIDER,
    (_event, id: string, updates: LlmProviderUpdate) => {
      try {
        if (!id) {
          return { success: false as const, error: 'Provider ID is required' }
        }
        if (updates.name !== undefined && !updates.name.trim()) {
          return { success: false as const, error: 'Provider name cannot be empty' }
        }
        if (updates.baseUrl !== undefined && updates.baseUrl) {
          try {
            new URL(updates.baseUrl)
          } catch {
            return { success: false as const, error: 'Invalid baseUrl format' }
          }
        }
        const result = DatabaseService.getInstance().updateProvider(id, updates)
        return { success: true as const, data: result }
      } catch (error) {
        return { success: false as const, error: String(error) }
      }
    },
  )

  ipcMain.handle(IPC_CHANNELS.LLM_DELETE_PROVIDER, (_event, id: string) => {
    try {
      if (!id) {
        return { success: false as const, error: 'Provider ID is required' }
      }
      const result = DatabaseService.getInstance().deleteProvider(id)
      return { success: true as const, data: result }
    } catch (error) {
      return { success: false as const, error: String(error) }
    }
  })
}
