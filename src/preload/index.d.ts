import { ElectronAPI } from '@electron-toolkit/preload'
import type {
  CustomAPI,
  StreamTokenEvent,
  StreamEndEvent,
  StreamErrorEvent,
  StreamToolCallEvent,
  StreamToolResultEvent,
} from '../shared/types'

export interface StreamingAPI {
  onStreamToken: (
    callback: (event: Electron.IpcRendererEvent, data: StreamTokenEvent) => void,
  ) => () => void
  onStreamEnd: (
    callback: (event: Electron.IpcRendererEvent, data: StreamEndEvent) => void,
  ) => () => void
  onStreamError: (
    callback: (event: Electron.IpcRendererEvent, data: StreamErrorEvent) => void,
  ) => () => void
  onStreamToolCall: (
    callback: (event: Electron.IpcRendererEvent, data: StreamToolCallEvent) => void,
  ) => () => void
  onStreamToolResult: (
    callback: (event: Electron.IpcRendererEvent, data: StreamToolResultEvent) => void,
  ) => () => void
  abortStream: (conversationId: string) => Promise<void>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: CustomAPI
    streaming: StreamingAPI
  }
}
