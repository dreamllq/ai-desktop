<script setup lang="ts">
import type { SkillConfig } from '@shared/types'

defineProps<{
  skill?: SkillConfig
  readOnly?: boolean
  onCancel: () => void
  onSaved: () => void
}>()
</script>

<template>
  <div>Skill Editor</div>
</template>
