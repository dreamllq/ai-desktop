<script setup lang="ts">
import type { SkillConfig } from '@shared/types'

defineProps<{
  showEditor: (skill?: SkillConfig, readOnly?: boolean) => void
}>()
</script>

<template>
  <div>Skill List</div>
</template>
