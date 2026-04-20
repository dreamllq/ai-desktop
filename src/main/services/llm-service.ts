import type { LlmResponse, LlmStreamChunk, LlmChatRequest } from '../../shared/types/agent'
import type { LlmProvider } from '../../shared/types/index'
import { OpenAICompatibleProvider } from './llm-provider-openai'

// Provider-agnostic interface
export interface ILLMProvider {
  chat(request: LlmChatRequest): Promise<LlmResponse>
  chatStream(request: LlmChatRequest): AsyncGenerator<LlmStreamChunk, void, undefined>
  supportsToolCalling(): boolean
  validate(): Promise<boolean>
}

// Mock provider for development
export class MockLLMProvider implements ILLMProvider {
  async chat(request: LlmChatRequest): Promise<LlmResponse> {
    const lastMessage = request.messages[request.messages.length - 1]
    const content = `Mock response to: "${lastMessage?.content?.slice(0, 50) ?? ''}"`

    return {
      content,
      toolCalls: [],
      stopReason: 'stop',
    }
  }

  async *chatStream(request: LlmChatRequest): AsyncGenerator<LlmStreamChunk, void, undefined> {
    const lastMessage = request.messages[request.messages.length - 1]
    const fullResponse = `Mock streaming response to: "${lastMessage?.content?.slice(0, 50) ?? ''}"`

    // Simulate token-by-token streaming
    for (let i = 0; i < fullResponse.length; i++) {
      yield {
        deltaContent: fullResponse[i],
        stopReason: undefined,
      }
      // Small delay to simulate real streaming
      await new Promise((resolve) => setTimeout(resolve, 10))
    }

    yield {
      deltaContent: null,
      usage: {
        promptTokens: 10,
        completionTokens: fullResponse.length,
        totalTokens: 10 + fullResponse.length,
      },
      stopReason: 'stop',
    }
  }

  supportsToolCalling(): boolean {
    return false
  }

  async validate(): Promise<boolean> {
    return true
  }
}

// Backward-compatible legacy interface for existing IPC handlers
interface LLMMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface LegacyLLMResponse {
  content: string
  model?: string
}

interface ILLMService {
  sendMessage(conversationId: string, messages: LLMMessage[]): Promise<LegacyLLMResponse>
}

class LegacyMockLLMService implements ILLMService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async sendMessage(_conversationId: string, _messages: LLMMessage[]): Promise<LegacyLLMResponse> {
    const delay = 500 + Math.random() * 500
    await new Promise((resolve) => setTimeout(resolve, delay))
    console.warn('[MockLLMService] Using mock response')
    return {
      content: `Mock response to: "${_messages[_messages.length - 1]?.content.slice(0, 50) ?? ''}"`,
      model: 'mock-v1',
    }
  }
}

export function createLLMService(): ILLMService {
  return new LegacyMockLLMService()
}

// Provider factory - creates provider instances from DB config
const providerCache = new Map<string, ILLMProvider>()

export function createLLMProvider(provider: LlmProvider, decryptedApiKey: string): ILLMProvider {
  const cacheKey = provider.id

  const cached = providerCache.get(cacheKey)
  if (cached) return cached

  const instance = decryptedApiKey
    ? new OpenAICompatibleProvider(provider, decryptedApiKey)
    : new MockLLMProvider()
  providerCache.set(cacheKey, instance)
  return instance
}

export function clearProviderCache(): void {
  providerCache.clear()
}
