import { readFileSync, writeFileSync, readdirSync, mkdirSync, statSync } from 'fs'
import { join, resolve } from 'path'
import { app } from 'electron'
import type { ToolDefinition, ToolResult } from '../../shared/types/agent'

// Get allowed base paths (user data dir + home dir)
function getAllowedPaths(): string[] {
  return [app.getPath('userData'), app.getPath('home')]
}

function isPathAllowed(targetPath: string): boolean {
  const resolved = resolve(targetPath)
  return getAllowedPaths().some((base) => resolved.startsWith(base))
}

export const fileSystemTools: ToolDefinition[] = [
  {
    name: 'file_read',
    description: 'Read the contents of a file',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Absolute path to the file' },
        encoding: { type: 'string', description: 'File encoding', default: 'utf-8' },
      },
      required: ['path'],
    },
    source: 'filesystem',
  },
  {
    name: 'file_write',
    description: 'Write content to a file',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Absolute path to the file' },
        content: { type: 'string', description: 'Content to write' },
        encoding: { type: 'string', description: 'File encoding', default: 'utf-8' },
      },
      required: ['path', 'content'],
    },
    source: 'filesystem',
  },
  {
    name: 'file_list',
    description: 'List files in a directory',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Absolute path to the directory' },
      },
      required: ['path'],
    },
    source: 'filesystem',
  },
  {
    name: 'directory_create',
    description: 'Create a directory recursively',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Absolute path of the directory to create' },
      },
      required: ['path'],
    },
    source: 'filesystem',
  },
]

export async function executeFileSystemTool(
  name: string,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  try {
    const targetPath = String(args.path || '')

    if (!isPathAllowed(targetPath)) {
      return {
        output: 'Access denied: path outside allowed directories',
        isError: true,
        source: 'filesystem',
      }
    }

    switch (name) {
      case 'file_read': {
        const encoding = String(args.encoding || 'utf-8') as BufferEncoding
        const content = readFileSync(targetPath, encoding)
        return { output: content, isError: false, source: 'filesystem' }
      }
      case 'file_write': {
        const content = String(args.content || '')
        const encoding = String(args.encoding || 'utf-8') as BufferEncoding
        writeFileSync(targetPath, content, encoding)
        return { output: `File written: ${targetPath}`, isError: false, source: 'filesystem' }
      }
      case 'file_list': {
        const entries = readdirSync(targetPath).map((entry) => {
          const fullPath = join(targetPath, entry)
          try {
            const stat = statSync(fullPath)
            return { name: entry, type: stat.isDirectory() ? 'directory' : 'file', size: stat.size }
          } catch {
            return { name: entry, type: 'unknown' }
          }
        })
        return { output: JSON.stringify(entries, null, 2), isError: false, source: 'filesystem' }
      }
      case 'directory_create': {
        mkdirSync(targetPath, { recursive: true })
        return { output: `Directory created: ${targetPath}`, isError: false, source: 'filesystem' }
      }
      default:
        return { output: `Unknown tool: ${name}`, isError: true, source: 'filesystem' }
    }
  } catch (err) {
    return {
      output: err instanceof Error ? err.message : String(err),
      isError: true,
      source: 'filesystem',
    }
  }
}
