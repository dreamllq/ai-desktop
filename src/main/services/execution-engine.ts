import type { ILLMProvider } from './llm-service'
import type { Streamer } from '../ipc/streaming'
import type { ToolRegistry } from './tool-registry'
import type { AgentRegistry } from './agent-registry'
import type { SkillManager } from './skill-manager'
import type { MessageRepository } from '../repositories/message'
import type {
  ExecutionRequest,
  IMemoryService,
  LlmMessage,
  LlmToolCall,
  SkillConfig,
  ToolCall,
} from '../../shared/types/agent'
import { buildMessages } from './llm-message-builder'

const MAX_ITERATIONS = 25

interface ToolCallAccumulator {
  id: string
  name: string
  arguments: string
}

export interface ExecutionEngineDeps {
  getProviderForModel: (modelId: string) => ILLMProvider
  toolRegistry: ToolRegistry
  agentRegistry: AgentRegistry
  skillManager: SkillManager
  messageRepo: MessageRepository
  memoryService?: IMemoryService
}

export class ExecutionEngine {
  private deps: ExecutionEngineDeps

  constructor(deps: ExecutionEngineDeps) {
    this.deps = deps
  }

  async execute(
    request: ExecutionRequest,
    streamer: Streamer,
    abortSignal?: AbortSignal,
  ): Promise<void> {
    let fullContent = ''
    let usage: { promptTokens: number; completionTokens: number; totalTokens: number } | undefined

    try {
      const agentResult = this.deps.agentRegistry.getAgent(request.agentId)
      if (!agentResult.success || !agentResult.data) {
        streamer.error(`Agent not found: ${request.agentId}`)
        return
      }
      const agentConfig = agentResult.data

      const skills = request.skillIds
        .map((id) => this.deps.skillManager.getSkill(id))
        .filter((s): s is SkillConfig & { enabled: true } => s !== null && s.enabled)

      let memoryContext: string[] | undefined
      if (this.deps.memoryService) {
        try {
          memoryContext = await this.deps.memoryService.getContext(
            request.conversationId,
            request.message,
          )
        } catch {
          memoryContext = undefined
        }
      }

      const conversationHistory = this.deps.messageRepo.list(request.conversationId)
      const messages = buildMessages({
        conversationHistory,
        agentConfig,
        skills,
        memoryContext,
      })

      const tools = await this.deps.toolRegistry.getAllTools()
      const provider = this.deps.getProviderForModel(request.modelId)

      for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
        if (abortSignal?.aborted) break

        const stream = provider.chatStream({
          messages,
          model: request.modelId,
          tools: tools.length > 0 ? tools : undefined,
          abortSignal,
        })

        let iterationContent = ''
        const toolCallAccumulators: ToolCallAccumulator[] = []

        for await (const chunk of stream) {
          if (abortSignal?.aborted) break

          if (chunk.deltaContent) {
            iterationContent += chunk.deltaContent
            streamer.sendToken(chunk.deltaContent)
          }

          if (chunk.deltaToolCalls) {
            for (const fragment of chunk.deltaToolCalls) {
              if (fragment.id) {
                toolCallAccumulators.push({
                  id: fragment.id,
                  name: fragment.name ?? '',
                  arguments: fragment.arguments ?? '',
                })
              } else if (toolCallAccumulators.length > 0) {
                const last = toolCallAccumulators[toolCallAccumulators.length - 1]
                if (fragment.name) last.name += fragment.name
                if (fragment.arguments) last.arguments += fragment.arguments
              }
            }
          }

          if (chunk.usage) {
            usage = chunk.usage
          }
        }

        if (abortSignal?.aborted) break

        fullContent += iterationContent

        if (toolCallAccumulators.length === 0) break

        const toolCalls = this.assembleToolCalls(toolCallAccumulators)

        const assistantLlmToolCalls: LlmToolCall[] = toolCallAccumulators.map((acc) => ({
          id: acc.id,
          name: acc.name,
          arguments: acc.arguments,
        }))

        messages.push({
          role: 'assistant',
          content: iterationContent || null,
          toolCalls: assistantLlmToolCalls,
        })

        for (const toolCall of toolCalls) {
          streamer.sendToolCall(toolCall)

          let result
          try {
            result = await this.deps.toolRegistry.executeTool(toolCall.name, toolCall.arguments)
          } catch (err) {
            result = {
              output: err instanceof Error ? err.message : String(err),
              isError: true,
              source: 'execution-engine',
            }
          }

          streamer.sendToolResult(result)

          messages.push({
            role: 'tool',
            content: result.output,
            toolCallId: toolCall.id,
          })
        }
      }

      this.saveAssistantMessage(
        request.conversationId,
        fullContent,
        this.extractToolCallsFromMessages(messages),
        request.modelId,
        usage,
      )

      if (this.deps.memoryService) {
        try {
          await this.deps.memoryService.storeInteraction(
            request.conversationId,
            'assistant',
            fullContent,
          )
        } catch {
          // Memory store failure is non-critical
        }
      }

      streamer.end(fullContent, usage)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)

      this.saveAssistantMessage(
        request.conversationId,
        fullContent || errorMsg,
        undefined,
        request.modelId,
        usage,
      )

      streamer.error(errorMsg)
    }
  }

  private assembleToolCalls(accumulators: ToolCallAccumulator[]): ToolCall[] {
    return accumulators
      .filter((acc) => acc.id && acc.name)
      .map((acc) => {
        let parsedArgs: Record<string, unknown> = {}
        try {
          parsedArgs = JSON.parse(acc.arguments) as Record<string, unknown>
        } catch {
          parsedArgs = {}
        }
        return { id: acc.id, name: acc.name, arguments: parsedArgs }
      })
  }

  private extractToolCallsFromMessages(messages: LlmMessage[]): ToolCall[] | undefined {
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')
    if (!lastAssistant?.toolCalls?.length) return undefined

    return lastAssistant.toolCalls.map((tc) => {
      let parsedArgs: Record<string, unknown> = {}
      try {
        parsedArgs = JSON.parse(tc.arguments) as Record<string, unknown>
      } catch {
        parsedArgs = {}
      }
      return { id: tc.id, name: tc.name, arguments: parsedArgs }
    })
  }

  private saveAssistantMessage(
    conversationId: string,
    content: string,
    toolCalls: ToolCall[] | undefined,
    model: string,
    tokenUsage?: { promptTokens: number; completionTokens: number; totalTokens: number },
  ): void {
    try {
      this.deps.messageRepo.createToolMessage({
        conversationId,
        role: 'assistant',
        content,
        toolCalls,
        model,
        tokenUsage,
      })
    } catch {
      // Save failure should not crash the app
    }
  }
}

export function createExecutionEngine(deps: ExecutionEngineDeps): ExecutionEngine {
  return new ExecutionEngine(deps)
}
