import { exec } from 'child_process'
import type { ToolDefinition, ToolResult } from '../../shared/types/agent'

export const commandTools: ToolDefinition[] = [
  {
    name: 'command_execute',
    description: 'Execute a shell command and return the output',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'The command to execute' },
        cwd: { type: 'string', description: 'Working directory' },
        timeout: { type: 'number', description: 'Timeout in milliseconds', default: 30000 },
      },
      required: ['command'],
    },
    source: 'commands',
  },
]

export async function executeCommandTool(
  name: string,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  try {
    if (name !== 'command_execute') {
      return { output: `Unknown tool: ${name}`, isError: true, source: 'commands' }
    }

    const command = String(args.command || '')
    const cwd = args.cwd ? String(args.cwd) : undefined
    const timeout = Number(args.timeout || 30000)

    return new Promise((resolve) => {
      exec(command, { cwd, timeout, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
          resolve({
            output: JSON.stringify({ error: error.message, stdout, stderr }),
            isError: true,
            source: 'commands',
          })
        } else {
          resolve({
            output: JSON.stringify({ stdout, stderr }),
            isError: false,
            source: 'commands',
          })
        }
      })
    })
  } catch (err) {
    return {
      output: err instanceof Error ? err.message : String(err),
      isError: true,
      source: 'commands',
    }
  }
}
