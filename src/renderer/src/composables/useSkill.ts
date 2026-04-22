import type { IpcResult, SkillConfig, SkillCreateParams, SkillUpdateParams } from '@shared/types'

export function useSkill(): {
  listSkills: () => Promise<IpcResult<SkillConfig[]>>
  getSkill: (id: string) => Promise<IpcResult<SkillConfig | null>>
  reloadSkills: () => Promise<IpcResult<boolean>>
  deleteSkill: (id: string) => Promise<IpcResult<boolean>>
  createSkill: (params: SkillCreateParams) => Promise<IpcResult<string>>
  updateSkill: (id: string, params: SkillUpdateParams) => Promise<IpcResult<boolean>>
} {
  async function listSkills(): Promise<IpcResult<SkillConfig[]>> {
    return window.api.listSkills()
  }

  async function getSkill(id: string): Promise<IpcResult<SkillConfig | null>> {
    return window.api.getSkill(id)
  }

  async function reloadSkills(): Promise<IpcResult<boolean>> {
    return window.api.reloadSkills()
  }

  async function deleteSkill(id: string): Promise<IpcResult<boolean>> {
    return window.api.deleteSkill(id)
  }

  async function createSkill(params: SkillCreateParams): Promise<IpcResult<string>> {
    return window.api.createSkill(params)
  }

  async function updateSkill(id: string, params: SkillUpdateParams): Promise<IpcResult<boolean>> {
    return window.api.updateSkill(id, params)
  }

  return { listSkills, getSkill, reloadSkills, deleteSkill, createSkill, updateSkill }
}
