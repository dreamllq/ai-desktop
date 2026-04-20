import { app } from 'electron'
import { existsSync, readdirSync, mkdirSync } from 'fs'
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
