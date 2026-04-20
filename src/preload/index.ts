import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IPC_CHANNELS, IPC_STREAM_EVENTS } from '@shared/types'
import type {
  CustomAPI,
  StreamTokenEvent,
  StreamEndEvent,
  StreamErrorEvent,
  StreamToolCallEvent,
  StreamToolResultEvent,
} from '@shared/types'

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

const streamingApi = {
  onStreamToken: (callback: (event: Electron.IpcRendererEvent, data: StreamTokenEvent) => void) => {
    ipcRenderer.on(IPC_STREAM_EVENTS.CHAT_STREAM_TOKEN, callback)
    return () => ipcRenderer.removeListener(IPC_STREAM_EVENTS.CHAT_STREAM_TOKEN, callback)
  },
  onStreamEnd: (callback: (event: Electron.IpcRendererEvent, data: StreamEndEvent) => void) => {
    ipcRenderer.on(IPC_STREAM_EVENTS.CHAT_STREAM_END, callback)
    return () => ipcRenderer.removeListener(IPC_STREAM_EVENTS.CHAT_STREAM_END, callback)
  },
  onStreamError: (callback: (event: Electron.IpcRendererEvent, data: StreamErrorEvent) => void) => {
    ipcRenderer.on(IPC_STREAM_EVENTS.CHAT_STREAM_ERROR, callback)
    return () => ipcRenderer.removeListener(IPC_STREAM_EVENTS.CHAT_STREAM_ERROR, callback)
  },
  onStreamToolCall: (
    callback: (event: Electron.IpcRendererEvent, data: StreamToolCallEvent) => void,
  ) => {
    ipcRenderer.on(IPC_STREAM_EVENTS.CHAT_STREAM_TOOL_CALL, callback)
    return () => ipcRenderer.removeListener(IPC_STREAM_EVENTS.CHAT_STREAM_TOOL_CALL, callback)
  },
  onStreamToolResult: (
    callback: (event: Electron.IpcRendererEvent, data: StreamToolResultEvent) => void,
  ) => {
    ipcRenderer.on(IPC_STREAM_EVENTS.CHAT_STREAM_TOOL_RESULT, callback)
    return () => ipcRenderer.removeListener(IPC_STREAM_EVENTS.CHAT_STREAM_TOOL_RESULT, callback)
  },
  abortStream: (conversationId: string) => {
    return ipcRenderer.invoke(IPC_STREAM_EVENTS.CHAT_STREAM_ABORT, conversationId)
  },
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('streaming', streamingApi)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
  // @ts-ignore (define in dts)
  window.streaming = streamingApi
}
