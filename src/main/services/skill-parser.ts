import type { SkillManifest } from '../../shared/types/agent'
import { readFileSync, existsSync } from 'fs'

export interface ParsedSkill {
  manifest: SkillManifest
  content: string
}

export class SkillParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SkillParseError'
  }
}

export function parseSkillFile(filePath: string): ParsedSkill {
  if (!existsSync(filePath)) {
    throw new SkillParseError(`Skill file not found: ${filePath}`)
  }

  const raw = readFileSync(filePath, 'utf-8')

  // Extract YAML frontmatter (between --- delimiters)
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/
  const match = raw.match(frontmatterRegex)

  if (!match) {
    throw new SkillParseError(`No YAML frontmatter found in: ${filePath}`)
  }

  const yamlContent = match[1]
  const content = raw.slice(match[0].length).trim()

  if (!content) {
    throw new SkillParseError(`No content body after frontmatter in: ${filePath}`)
  }

  // Simple YAML parser for flat key-value + arrays
  const manifest = parseSimpleYaml(yamlContent)

  // Validate required fields
  if (!manifest.name) {
    throw new SkillParseError(`Missing required field 'name' in: ${filePath}`)
  }
  if (!manifest.version) {
    throw new SkillParseError(`Missing required field 'version' in: ${filePath}`)
  }
  if (!manifest.description) {
    throw new SkillParseError(`Missing required field 'description' in: ${filePath}`)
  }

  return { manifest, content }
}

function parseSimpleYaml(yaml: string): SkillManifest {
  const result: Record<string, unknown> = {}
  const lines = yaml.split('\n')
  let currentKey = ''
  let inArray = false
  let arrayItems: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()

    // Array item
    if (inArray && trimmed.startsWith('- ')) {
      arrayItems.push(trimmed.slice(2).trim())
      continue
    }

    // End of array section
    if (inArray && currentKey) {
      result[currentKey] = arrayItems
      inArray = false
      arrayItems = []
      currentKey = ''
    }

    // Key-value pair
    const colonIndex = trimmed.indexOf(':')
    if (colonIndex === -1) continue

    const key = trimmed.slice(0, colonIndex).trim()
    const value = trimmed.slice(colonIndex + 1).trim()

    if (value === '') {
      // Start of array section
      currentKey = key
      inArray = true
      arrayItems = []
    } else {
      // String value - remove quotes if present
      result[key] = value.replace(/^['"]|['"]$/g, '')
    }
  }

  // Handle last array section
  if (inArray && currentKey) {
    result[currentKey] = arrayItems
  }

  return {
    name: (result.name as string) || '',
    version: (result.version as string) || '',
    description: (result.description as string) || '',
    requiredTools: (result.requiredTools as string[]) || [],
    triggers: result.triggers as string[] | undefined,
  }
}
