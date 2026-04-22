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

  listAgents: () => ipcRenderer.invoke(IPC_CHANNELS.AGENT_LIST),
  getAgent: (id) => ipcRenderer.invoke(IPC_CHANNELS.AGENT_GET, id),
  registerAgent: (params) => ipcRenderer.invoke(IPC_CHANNELS.AGENT_REGISTER, params),
  updateAgent: (id, params) => ipcRenderer.invoke(IPC_CHANNELS.AGENT_UPDATE, id, params),
  deleteAgent: (id) => ipcRenderer.invoke(IPC_CHANNELS.AGENT_DELETE, id),

  listSkills: () => ipcRenderer.invoke(IPC_CHANNELS.SKILL_LIST),
  getSkill: (id) => ipcRenderer.invoke(IPC_CHANNELS.SKILL_GET, id),
  reloadSkills: () => ipcRenderer.invoke(IPC_CHANNELS.SKILL_RELOAD),
  deleteSkill: (id) => ipcRenderer.invoke(IPC_CHANNELS.SKILL_DELETE, id),
  createSkill: (params) => ipcRenderer.invoke(IPC_CHANNELS.SKILL_CREATE, params),
  updateSkill: (id, params) => ipcRenderer.invoke(IPC_CHANNELS.SKILL_UPDATE, id, params),

  listMcpServers: () => ipcRenderer.invoke(IPC_CHANNELS.MCP_LIST_SERVERS),
  getMcpServer: (id) => ipcRenderer.invoke(IPC_CHANNELS.MCP_GET_SERVER, id),
  addMcpServer: (params) => ipcRenderer.invoke(IPC_CHANNELS.MCP_ADD_SERVER, params),
  updateMcpServer: (id, params) => ipcRenderer.invoke(IPC_CHANNELS.MCP_UPDATE_SERVER, id, params),
  deleteMcpServer: (id) => ipcRenderer.invoke(IPC_CHANNELS.MCP_DELETE_SERVER, id),
  listMcpTools: (serverId) => ipcRenderer.invoke(IPC_CHANNELS.MCP_LIST_TOOLS, serverId),
  executeMcpTool: (serverId, toolName, args) =>
    ipcRenderer.invoke(IPC_CHANNELS.MCP_EXECUTE_TOOL, serverId, toolName, args),
  getMcpServerStatus: (serverId) =>
    ipcRenderer.invoke(IPC_CHANNELS.MCP_GET_SERVER_STATUS, serverId),
  startMcpServer: (id) => ipcRenderer.invoke(IPC_CHANNELS.MCP_START_SERVER, id),
  stopMcpServer: (id) => ipcRenderer.invoke(IPC_CHANNELS.MCP_STOP_SERVER, id),
  testMcpConnection: (params) =>
    ipcRenderer.invoke(IPC_CHANNELS.MCP_TEST_CONNECTION, params),

  listAvailableModels: () => ipcRenderer.invoke(IPC_CHANNELS.MODEL_LIST_AVAILABLE),

  createConversationWithConfig: (params) =>
    ipcRenderer.invoke(IPC_CHANNELS.CHAT_CREATE_WITH_CONFIG, params),
  switchModel: (conversationId, modelId) =>
    ipcRenderer.invoke(IPC_CHANNELS.CHAT_SWITCH_MODEL, conversationId, modelId),
  getConversationConfig: (conversationId) =>
    ipcRenderer.invoke(IPC_CHANNELS.CHAT_GET_CONFIG, conversationId),
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
  Object.assign(globalThis, { electron: electronAPI, api, streaming: streamingApi })
}
