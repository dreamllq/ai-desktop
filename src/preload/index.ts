import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC_CHANNELS } from '@shared/types'
import type { CustomAPI } from '@shared/types'

const api: CustomAPI = {
  ping: () => ipcRenderer.invoke(IPC_CHANNELS.PING),
  getAppInfo: () => ipcRenderer.invoke(IPC_CHANNELS.GET_APP_INFO),
  getSetting: (key) => ipcRenderer.invoke(IPC_CHANNELS.GET_SETTING, key),
  setSetting: (key, value) => ipcRenderer.invoke(IPC_CHANNELS.SET_SETTING, key, value),
  openSettings: () => ipcRenderer.invoke(IPC_CHANNELS.OPEN_SETTINGS),
  openAbout: () => ipcRenderer.invoke(IPC_CHANNELS.OPEN_ABOUT),
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
