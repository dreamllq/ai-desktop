<script setup lang="ts">
import { ref } from 'vue'
import SkillList from '@renderer/components/skill/SkillList.vue'
import SkillEditor from '@renderer/components/skill/SkillEditor.vue'
import type { SkillConfig } from '@shared/types'

const view = ref<'list' | 'editor'>('list')
const editingSkill = ref<SkillConfig | undefined>()
const readOnly = ref(false)

function showEditor(skill?: SkillConfig, ro = false): void {
  editingSkill.value = skill
  readOnly.value = ro
  view.value = 'editor'
}

function showList(): void {
  view.value = 'list'
  editingSkill.value = undefined
  readOnly.value = false
}
</script>

<template>
  <div class="h-full">
    <SkillList v-if="view === 'list'" :show-editor="showEditor" />
    <SkillEditor
      v-else
      :skill="editingSkill"
      :read-only="readOnly"
      :on-cancel="showList"
      :on-saved="showList"
    />
  </div>
</template>
