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
  listProviders: () => ipcRenderer.invoke(IPC_CHANNELS.LLM_LIST_PROVIDERS),
  getProvider: (id) => ipcRenderer.invoke(IPC_CHANNELS.LLM_GET_PROVIDER, id),
  createProvider: (data) => ipcRenderer.invoke(IPC_CHANNELS.LLM_CREATE_PROVIDER, data),
  updateProvider: (id, updates) =>
    ipcRenderer.invoke(IPC_CHANNELS.LLM_UPDATE_PROVIDER, id, updates),
  deleteProvider: (id) => ipcRenderer.invoke(IPC_CHANNELS.LLM_DELETE_PROVIDER, id),
  listConversations: () => ipcRenderer.invoke(IPC_CHANNELS.CHAT_LIST_CONVERSATIONS),
  getConversation: (id) => ipcRenderer.invoke(IPC_CHANNELS.CHAT_GET_CONVERSATION, id),
  createConversation: (title?) => ipcRenderer.invoke(IPC_CHANNELS.CHAT_CREATE_CONVERSATION, title),
  updateConversation: (id, title) =>
    ipcRenderer.invoke(IPC_CHANNELS.CHAT_UPDATE_CONVERSATION, id, title),
  deleteConversation: (id) => ipcRenderer.invoke(IPC_CHANNELS.CHAT_DELETE_CONVERSATION, id),
  listMessages: (conversationId) =>
    ipcRenderer.invoke(IPC_CHANNELS.CHAT_LIST_MESSAGES, conversationId),
  sendMessage: (conversationId, content) =>
    ipcRenderer.invoke(IPC_CHANNELS.CHAT_SEND_MESSAGE, conversationId, content),
  getActiveConversation: () => ipcRenderer.invoke(IPC_CHANNELS.CHAT_GET_ACTIVE_CONVERSATION),
  setActiveConversation: (id) => ipcRenderer.invoke(IPC_CHANNELS.CHAT_SET_ACTIVE_CONVERSATION, id),
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
