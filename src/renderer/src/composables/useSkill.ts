import type { IpcResult, SkillConfig } from '@shared/types'

export function useSkill() {
  async function listSkills(): Promise<IpcResult<SkillConfig[]>> {
    return window.api.listSkills()
  }

  async function getSkill(id: string): Promise<IpcResult<SkillConfig | null>> {
    return window.api.getSkill(id)
  }

  async function reloadSkills(): Promise<IpcResult<boolean>> {
    return window.api.reloadSkills()
  }

  return { listSkills, getSkill, reloadSkills }
}
