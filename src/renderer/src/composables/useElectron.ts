import type { AppInfo, CustomAPI } from '@shared/types'

export function useElectron(): CustomAPI {
  const api = window.api

  function ping(): Promise<string> {
    return api.ping()
  }

  function getAppInfo(): Promise<AppInfo> {
    return api.getAppInfo()
  }

  function getSetting(key: string): Promise<string | null> {
    return api.getSetting(key)
  }

  function setSetting(key: string, value: string): Promise<void> {
    return api.setSetting(key, value)
  }

  return { ping, getAppInfo, getSetting, setSetting }
}
