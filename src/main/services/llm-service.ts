export interface LLMMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface LLMResponse {
  content: string
  model?: string
}

export interface ILLMService {
  sendMessage(conversationId: string, messages: LLMMessage[]): Promise<LLMResponse>
}

const MOCK_RESPONSE = `你好！我是 AI 助手。这是一个模拟回复。

**功能特点：**

- 支持 Markdown 渲染
- 代码高亮显示

\`\`\`python
def hello():
    print("Hello, World!")
\`\`\`
`

class MockLLMService implements ILLMService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async sendMessage(_conversationId: string, _messages: LLMMessage[]): Promise<LLMResponse> {
    const delay = 500 + Math.random() * 500
    await new Promise((resolve) => setTimeout(resolve, delay))
    console.warn('[MockLLMService] Using mock response')
    return { content: MOCK_RESPONSE, model: 'mock-v1' }
  }
}

export function createLLMService(): ILLMService {
  return new MockLLMService()
}
