export const IPC_CHANNELS = {
  PING: 'ping',
  GET_APP_INFO: 'get-app-info',
  GET_SETTING: 'get-setting',
  SET_SETTING: 'set-setting',
  OPEN_SETTINGS: 'open-settings',
  OPEN_ABOUT: 'open-about',
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]

export interface AppInfo {
  name: string
  version: string
  electronVersion: string
  chromeVersion: string
  nodeVersion: string
  platform: string
}

// Custom API exposed via contextBridge — this is the contract between preload and renderer
export interface CustomAPI {
  ping: () => Promise<string>
  getAppInfo: () => Promise<AppInfo>
  getSetting: (key: string) => Promise<string | null>
  setSetting: (key: string, value: string) => Promise<void>
  openSettings: () => Promise<void>
  openAbout: () => Promise<void>
}
