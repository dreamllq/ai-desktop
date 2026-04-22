import { app } from 'electron'
import { existsSync, readdirSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { parseSkillFile } from './skill-parser'
import { SkillRepository } from '../repositories/skill'
import type { SkillConfig, SkillSource } from '../../shared/types/agent'

export class SkillManager {
  private repository: SkillRepository
  private initialized = false

  constructor(repository: SkillRepository) {
    this.repository = repository
  }

  async initialize(): Promise<void> {
    if (this.initialized) return

    const userSkillsDir = this.getUserSkillsDir()
    if (!existsSync(userSkillsDir)) {
      mkdirSync(userSkillsDir, { recursive: true })
    }

    this.loadBuiltInSkills()
    this.loadUserSkills()

    this.initialized = true
  }

  async reloadSkills(): Promise<void> {
    this.loadBuiltInSkills()
    this.loadUserSkills()
  }

  listSkills(): SkillConfig[] {
    return this.repository.list()
  }

  getSkill(id: string): SkillConfig | null {
    return this.repository.get(id)
  }

  getSkillByName(name: string): SkillConfig | null {
    return this.repository.list().find((s) => s.name === name) ?? null
  }

  getBuiltInSkills(): SkillConfig[] {
    return this.repository.getBySource('built-in')
  }

  getUserSkills(): SkillConfig[] {
    return this.repository.getBySource('user-defined')
  }

  createSkill(params: {
    name: string
    description: string
    content: string
  }): { success: boolean; id?: string; error?: string } {
    if (!params.name?.trim()) return { success: false, error: 'Skill name is required' }

    const existing = this.getSkillByName(params.name)
    if (existing) return { success: false, error: `Skill with name "${params.name}" already exists` }

    const fileContent = `---
name: ${params.name}
version: 1.0.0
description: ${params.description}
requiredTools: []
---

${params.content}`

    const fileName =
      params.name
        .replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]/g, '-')
        .toLowerCase() + '.md'
    const filePath = join(this.getUserSkillsDir(), fileName)

    writeFileSync(filePath, fileContent, 'utf-8')

    try {
      const parsed = parseSkillFile(filePath)
      const id = this.repository.create({
        name: parsed.manifest.name,
        description: parsed.manifest.description,
        source: 'user-defined' as const,
        filePath,
        manifest: parsed.manifest,
        content: parsed.content,
        enabled: true,
      })
      return { success: true, id }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  updateSkill(
    id: string,
    params: { name?: string; description?: string; content?: string; enabled?: boolean },
  ): { success: boolean; error?: string } {
    const skill = this.repository.get(id)
    if (!skill) return { success: false, error: 'Skill not found' }
    if (skill.source === 'built-in') return { success: false, error: 'Cannot modify built-in skills' }

    const updates: Record<string, unknown> = {}
    if (params.name !== undefined) updates.name = params.name
    if (params.description !== undefined) updates.description = params.description
    if (params.enabled !== undefined) updates.enabled = params.enabled

    if (params.content !== undefined || params.name !== undefined || params.description !== undefined) {
      const content = params.content ?? skill.content

      const manifest = { ...skill.manifest }
      if (params.name !== undefined) manifest.name = params.name
      if (params.description !== undefined) manifest.description = params.description

      const fileContent = `---
name: ${manifest.name}
version: ${manifest.version}
description: ${manifest.description}
requiredTools: ${JSON.stringify(manifest.requiredTools)}
---

${content}`

      if (skill.filePath) {
        writeFileSync(skill.filePath, fileContent, 'utf-8')
      }

      updates.manifest = manifest
      updates.content = content
    }

    const result = this.repository.update(id, updates)
    return { success: result }
  }

  deleteSkill(id: string): { success: boolean; error?: string } {
    const skill = this.repository.get(id)
    if (!skill) return { success: false, error: 'Skill not found' }
    if (skill.source === 'built-in') {
      return { success: false, error: 'Cannot delete built-in skills' }
    }
    return { success: this.repository.delete(id) }
  }

  private getBuiltInSkillsDir(): string {
    if (app.isPackaged) {
      return join(process.resourcesPath, 'skills')
    }
    return join(process.cwd(), 'skills')
  }

  private getUserSkillsDir(): string {
    return join(app.getPath('userData'), 'skills')
  }

  private loadBuiltInSkills(): void {
    this.loadSkillsFromDir(this.getBuiltInSkillsDir(), 'built-in')
  }

  private loadUserSkills(): void {
    this.loadSkillsFromDir(this.getUserSkillsDir(), 'user-defined')
  }

  private loadSkillsFromDir(dir: string, source: SkillSource): void {
    if (!existsSync(dir)) return

    const files = readdirSync(dir).filter((f) => f.endsWith('.md'))
    for (const file of files) {
      try {
        const filePath = join(dir, file)
        const parsed = parseSkillFile(filePath)
        const existing = this.getSkillByName(parsed.manifest.name)

        if (!existing) {
          this.repository.create({
            name: parsed.manifest.name,
            description: parsed.manifest.description,
            source,
            filePath,
            manifest: parsed.manifest,
            content: parsed.content,
            enabled: true,
          })
        } else {
          this.repository.update(existing.id, {
            description: parsed.manifest.description,
            manifest: parsed.manifest,
            content: parsed.content,
          })
        }
      } catch (err) {
        console.error(`Failed to load skill ${file}:`, err)
      }
    }
  }
}
