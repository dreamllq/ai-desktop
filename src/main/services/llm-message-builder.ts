import type { Message } from '@shared/types'
import type { AgentConfig, SkillConfig, LlmMessage, LlmToolCall } from '../../shared/types/agent'

export interface BuildMessagesParams {
  conversationHistory: Message[]
  agentConfig: AgentConfig
  skills: SkillConfig[]
  memoryContext?: string[]
}

export function buildMessages(params: BuildMessagesParams): LlmMessage[] {
  const { conversationHistory, agentConfig, skills, memoryContext } = params

  const messages: LlmMessage[] = []

  const systemParts: string[] = []

  systemParts.push(`# Agent: ${agentConfig.manifest.name}`)
  systemParts.push(agentConfig.manifest.description)

  for (const skill of skills) {
    if (skill.content) {
      systemParts.push(`\n## Skill: ${skill.name}\n${skill.content}`)
    }
  }

  if (memoryContext && memoryContext.length > 0) {
    systemParts.push('\n## Relevant Context from Memory')
    for (const ctx of memoryContext) {
      systemParts.push(ctx)
    }
  }

  messages.push({
    role: 'system',
    content: systemParts.join('\n'),
  })

  for (const msg of conversationHistory) {
    if (msg.role === 'user') {
      messages.push({
        role: 'user',
        content: msg.content,
      })
    } else if (msg.role === 'assistant') {
      const assistantMsg: LlmMessage = {
        role: 'assistant',
        content: msg.content,
      }
      if (msg.toolCalls && msg.toolCalls.length > 0) {
        assistantMsg.toolCalls = msg.toolCalls.map(
          (tc): LlmToolCall => ({
            id: tc.id,
            name: tc.name,
            arguments:
              typeof tc.arguments === 'string' ? tc.arguments : JSON.stringify(tc.arguments),
          }),
        )
      }
      messages.push(assistantMsg)
    } else if (msg.role === 'tool') {
      messages.push({
        role: 'tool',
        content: msg.content,
        toolCallId: msg.toolCallId,
      })
    } else if (msg.role === 'system') {
      messages.push({
        role: 'system',
        content: msg.content,
      })
    }
  }

  return messages
}
