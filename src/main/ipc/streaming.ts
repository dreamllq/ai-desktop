import { IPC_STREAM_EVENTS } from '../../shared/types/index'
import type {
  StreamTokenEvent,
  StreamEndEvent,
  StreamErrorEvent,
  StreamToolCallEvent,
  StreamToolResultEvent,
  ToolCall,
  ToolResult,
} from '../../shared/types/agent'

export interface Streamer {
  sendToken(token: string): void
  sendToolCall(toolCall: ToolCall): void
  sendToolResult(toolResult: ToolResult): void
  end(fullContent: string, usage?: StreamEndEvent['usage']): void
  error(errorMsg: string): void
}

export function createStreamer(
  webContents: Electron.WebContents,
  conversationId: string,
  messageId: string,
): Streamer {
  let tokenIndex = 0
  let tokenBuffer = ''
  let bufferTimer: ReturnType<typeof setTimeout> | null = null

  // Batch tokens with 16ms debounce to avoid IPC flood
  const flushBuffer = (): void => {
    if (tokenBuffer) {
      const event: StreamTokenEvent = {
        conversationId,
        messageId,
        token: tokenBuffer,
        index: tokenIndex,
      }
      webContents.send(IPC_STREAM_EVENTS.CHAT_STREAM_TOKEN, event)
      tokenIndex++
      tokenBuffer = ''
    }
    bufferTimer = null
  }

  return {
    sendToken(token: string) {
      tokenBuffer += token
      if (!bufferTimer) {
        bufferTimer = setTimeout(flushBuffer, 16)
      }
    },

    sendToolCall(toolCall: ToolCall) {
      // Flush any buffered tokens first
      if (bufferTimer) {
        clearTimeout(bufferTimer)
        flushBuffer()
      }
      const event: StreamToolCallEvent = {
        conversationId,
        messageId,
        toolCall,
      }
      webContents.send(IPC_STREAM_EVENTS.CHAT_STREAM_TOOL_CALL, event)
    },

    sendToolResult(toolResult: ToolResult) {
      const event: StreamToolResultEvent = {
        conversationId,
        messageId,
        toolResult,
      }
      webContents.send(IPC_STREAM_EVENTS.CHAT_STREAM_TOOL_RESULT, event)
    },

    end(fullContent: string, usage?: StreamEndEvent['usage']) {
      // Flush any remaining buffered tokens
      if (bufferTimer) {
        clearTimeout(bufferTimer)
        flushBuffer()
      }
      const event: StreamEndEvent = {
        conversationId,
        messageId,
        fullContent,
        usage,
      }
      webContents.send(IPC_STREAM_EVENTS.CHAT_STREAM_END, event)
    },

    error(errorMsg: string) {
      // Flush any remaining buffered tokens
      if (bufferTimer) {
        clearTimeout(bufferTimer)
        flushBuffer()
      }
      const event: StreamErrorEvent = {
        conversationId,
        messageId,
        error: errorMsg,
      }
      webContents.send(IPC_STREAM_EVENTS.CHAT_STREAM_ERROR, event)
    },
  }
}
