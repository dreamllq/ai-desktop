import type { ILLMProvider } from './llm-service'
import type {
  LlmResponse,
  LlmStreamChunk,
  LlmChatRequest,
  LlmToolCall,
} from '../../shared/types/agent'
import type { LlmProvider } from '../../shared/types/index'

interface OpenAIMessage {
  role: string
  content?: string | null
  tool_calls?: OpenAIToolCall[]
  tool_call_id?: string
}

interface OpenAIToolCall {
  id?: string
  type?: string
  function: { name?: string; arguments?: string }
}

interface OpenAIChoice {
  message?: OpenAIMessage
  delta?: OpenAIMessage
  finish_reason?: string | null
}

interface OpenAIResponse {
  choices?: OpenAIChoice[]
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

interface OpenAIStreamToolCall {
  id?: string
  function?: { name?: string; arguments?: string }
}

interface OpenAIStreamDelta {
  content?: string | null
  tool_calls?: OpenAIStreamToolCall[]
}

interface OpenAIStreamChoice {
  delta?: OpenAIStreamDelta
  finish_reason?: string | null
}

interface OpenAIStreamChunk {
  choices?: OpenAIStreamChoice[]
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

export class OpenAICompatibleProvider implements ILLMProvider {
  private baseUrl: string
  private apiPath: string
  private apiKey: string
  private timeout: number
  private customHeaders: Record<string, string>

  constructor(provider: LlmProvider, decryptedApiKey: string) {
    this.baseUrl = provider.baseUrl
    this.apiPath = provider.apiPath
    this.apiKey = decryptedApiKey
    this.timeout = provider.timeout || 30000
    this.customHeaders = {}
    for (const h of provider.customHeaders) {
      this.customHeaders[h.key] = h.value
    }
  }

  async chat(request: LlmChatRequest): Promise<LlmResponse> {
    const url = `${this.baseUrl}${this.apiPath}`
    const body = this.buildRequestBody(request, false)

    const response = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
      signal: request.abortSignal,
    })

    if (!response.ok) {
      throw this.handleError(response.status, await response.text())
    }

    const data: OpenAIResponse = await response.json()
    return this.normalizeResponse(data)
  }

  async *chatStream(request: LlmChatRequest): AsyncGenerator<LlmStreamChunk, void, undefined> {
    const url = `${this.baseUrl}${this.apiPath}`
    const body = this.buildRequestBody(request, true)

    const response = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
      signal: request.abortSignal,
    })

    if (!response.ok) {
      throw this.handleError(response.status, await response.text())
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed === 'data: [DONE]') continue
          if (!trimmed.startsWith('data: ')) continue

          let chunk: OpenAIStreamChunk
          try {
            chunk = JSON.parse(trimmed.slice(6))
          } catch {
            continue
          }

          const delta = chunk.choices?.[0]?.delta
          if (!delta) continue

          const streamChunk: LlmStreamChunk = {
            deltaContent: delta.content ?? null,
          }

          if (delta.tool_calls) {
            streamChunk.deltaToolCalls = delta.tool_calls.map((tc) => ({
              id: tc.id || undefined,
              name: tc.function?.name || undefined,
              arguments: tc.function?.arguments || undefined,
            }))
          }

          if (chunk.choices?.[0]?.finish_reason) {
            streamChunk.stopReason = chunk.choices[0].finish_reason
          }

          if (chunk.usage) {
            streamChunk.usage = {
              promptTokens: chunk.usage.prompt_tokens || 0,
              completionTokens: chunk.usage.completion_tokens || 0,
              totalTokens: chunk.usage.total_tokens || 0,
            }
          }

          yield streamChunk
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  supportsToolCalling(): boolean {
    return true
  }

  async validate(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/v1/models`
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${this.apiKey}` },
      })
      return response.ok
    } catch {
      return false
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      ...this.customHeaders,
    }
  }

  private buildRequestBody(request: LlmChatRequest, stream: boolean): Record<string, unknown> {
    const messages: Record<string, unknown>[] = request.messages.map((m) => {
      const msg: Record<string, unknown> = { role: m.role, content: m.content }
      if (m.toolCalls) {
        msg.tool_calls = m.toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function',
          function: { name: tc.name, arguments: tc.arguments },
        }))
      }
      if (m.toolCallId) {
        msg['tool_call_id'] = m.toolCallId
      }
      return msg
    })

    const body: Record<string, unknown> = {
      model: request.model,
      messages,
      stream,
    }

    if (request.tools && request.tools.length > 0) {
      body.tools = request.tools.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.inputSchema,
        },
      }))
    }

    if (request.temperature !== undefined) body.temperature = request.temperature
    if (request.maxTokens !== undefined) body.max_tokens = request.maxTokens
    if (request.topP !== undefined) body.top_p = request.topP

    return body
  }

  private normalizeResponse(data: OpenAIResponse): LlmResponse {
    const choice = data.choices?.[0]
    const message = choice?.message

    const toolCalls: LlmToolCall[] = (message?.tool_calls || []).map((tc) => ({
      id: tc.id || '',
      name: tc.function?.name || '',
      arguments: tc.function?.arguments || '{}',
    }))

    return {
      content: message?.content ?? null,
      toolCalls,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens || 0,
            completionTokens: data.usage.completion_tokens || 0,
            totalTokens: data.usage.total_tokens || 0,
          }
        : undefined,
      stopReason: choice?.finish_reason || 'stop',
    }
  }

  private handleError(status: number, body: string): Error {
    switch (status) {
      case 401:
        return new Error(`Authentication failed: ${body}`)
      case 429:
        return new Error(`Rate limited: ${body}`)
      case 500:
        return new Error(`Server error: ${body}`)
      default:
        return new Error(`HTTP ${status}: ${body}`)
    }
  }

  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    const combinedSignal = options.signal
      ? AbortSignal.any([controller.signal, options.signal])
      : controller.signal

    try {
      return await fetch(url, { ...options, signal: combinedSignal })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error('Request timed out or was aborted')
      }
      throw err
    } finally {
      clearTimeout(timeoutId)
    }
  }
}
