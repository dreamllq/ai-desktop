import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/types/index'
import type { IpcResult, SkillConfig } from '../../shared/types/index'
import type { SkillManager } from '../services/skill-manager'

export function registerSkillHandlers(getManager: () => SkillManager): void {
  ipcMain.handle(IPC_CHANNELS.SKILL_LIST, (): IpcResult<SkillConfig[]> => {
    try {
      const skills = getManager().listSkills()
      return { success: true, data: skills }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.SKILL_GET, (_event, id: string): IpcResult<SkillConfig | null> => {
    try {
      if (!id) return { success: false, error: 'Skill ID is required' }
      const skill = getManager().getSkill(id)
      return { success: true, data: skill }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.SKILL_RELOAD, async (): Promise<IpcResult<boolean>> => {
    try {
      await getManager().reloadSkills()
      return { success: true, data: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle(IPC_CHANNELS.SKILL_DELETE, (_event, id: string): IpcResult<boolean> => {
    try {
      if (!id) return { success: false, error: 'Skill ID is required' }
      const result = getManager().deleteSkill(id)
      if (result.success) return { success: true, data: true }
      return { success: false, error: result.error }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })
}
