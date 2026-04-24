<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSkillConfigStore } from '@renderer/stores/skillConfig'
import type { SkillConfig } from '@shared/types'

const props = defineProps<{
  showEditor: (skill?: SkillConfig, readOnly?: boolean) => void
}>()

const store = useSkillConfigStore()
const searchQuery = ref('')
const deletingId = ref<string | null>(null)

const filteredSkills = computed(() => {
  if (!searchQuery.value.trim()) return store.skills
  const q = searchQuery.value.toLowerCase()
  return store.skills.filter(
    (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
  )
})

function getToolTags(skill: SkillConfig): { shown: string[]; overflow: number } {
  const tools = skill.manifest?.requiredTools ?? []
  return { shown: tools.slice(0, 3), overflow: Math.max(0, tools.length - 3) }
}

function confirmDelete(id: string): void {
  deletingId.value = id
}

function cancelDelete(): void {
  deletingId.value = null
}

async function executeDelete(id: string): Promise<void> {
  await store.removeSkill(id)
  deletingId.value = null
}

onMounted(() => {
  store.loadSkills()
})
</script>

<template>
  <div class="h-full overflow-y-auto p-6">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-lg font-medium text-gray-900">技能管理</h2>
        <p class="mt-1 text-sm text-gray-500">管理内置和自定义技能</p>
      </div>
      <div class="flex gap-2">
        <button
          class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          @click="store.reloadAllSkills()"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          重新加载
        </button>
        <button
          class="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          @click="props.showEditor()"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          创建技能
        </button>
      </div>
    </div>

    <!-- Search Bar -->
    <div v-if="!store.loading && !store.error && store.skills.length > 0" class="relative mb-4">
      <svg
        class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索技能..."
        class="w-full rounded-md border border-gray-300 py-1.5 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex items-center justify-center py-20">
      <svg class="h-6 w-6 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <span class="ml-3 text-sm text-gray-500">加载中...</span>
    </div>

    <!-- Error -->
    <div v-else-if="store.error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
      <p class="text-sm text-red-700">{{ store.error }}</p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="store.skills.length === 0"
      class="flex flex-col items-center justify-center py-16"
    >
      <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <svg
          class="h-8 w-8 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      </div>
      <p class="text-sm font-medium text-gray-900">还没有任何技能</p>
      <p class="mt-1 text-xs text-gray-500">添加您的第一个自定义技能</p>
      <button
        class="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        @click="props.showEditor()"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        创建技能
      </button>
    </div>

    <!-- Skill Cards -->
    <div v-else class="grid grid-cols-1 gap-4">
      <div
        v-for="skill in filteredSkills"
        :key="skill.id"
        class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <!-- Card Header: Source Badge + Name -->
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-semibold text-gray-900">{{ skill.name }}</h3>
            <span
              class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              :class="
                skill.source === 'built-in'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-green-50 text-green-700'
              "
            >
              {{ skill.source === 'built-in' ? '内置' : '自定义' }}
            </span>
          </div>
        </div>

        <!-- Description -->
        <p class="mt-1.5 line-clamp-2 text-sm text-gray-500">
          {{ skill.description }}
        </p>

        <!-- Required Tools Tags -->
        <div v-if="getToolTags(skill).shown.length > 0" class="mt-2 flex flex-wrap gap-1">
          <span
            v-for="tool in getToolTags(skill).shown"
            :key="tool"
            class="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600"
          >
            {{ tool }}
          </span>
          <span
            v-if="getToolTags(skill).overflow > 0"
            class="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600"
          >
            +{{ getToolTags(skill).overflow }}
          </span>
        </div>

        <!-- Delete Confirmation (inline) -->
        <div
          v-if="deletingId === skill.id"
          class="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2.5"
        >
          <p class="text-xs text-red-700">
            确定要删除 "{{ skill.name }}" 吗？此操作不可撤销。
          </p>
          <div class="mt-2 flex gap-2">
            <button
              class="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-red-700"
              @click="executeDelete(skill.id)"
            >
              确认删除
            </button>
            <button
              class="rounded-md bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-gray-300 transition-colors hover:bg-gray-50"
              @click="cancelDelete"
            >
              取消
            </button>
          </div>
        </div>

        <!-- Card Actions -->
        <div v-else class="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
          <div class="flex gap-2">
            <!-- Built-in: View only -->
            <template v-if="skill.source === 'built-in'">
              <button
                class="rounded-md px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
                @click="props.showEditor(skill, true)"
              >
                查看
              </button>
            </template>
            <!-- Custom: Edit + Delete -->
            <template v-else>
              <button
                class="rounded-md px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
                @click="props.showEditor(skill)"
              >
                编辑
              </button>
              <button
                class="rounded-md px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                @click="confirmDelete(skill.id)"
              >
                删除
              </button>
            </template>
          </div>
          <!-- Enable/Disable Toggle (not for built-in skills) -->
          <label v-if="skill.source !== 'built-in'" class="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              :checked="skill.enabled"
              class="peer sr-only"
              @change="store.toggleSkill(skill.id, !skill.enabled)"
            />
            <div
              class="h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:bg-blue-600 peer-checked:after:translate-x-4"
            />
          </label>
        </div>
      </div>
    </div>
  </div>
</template>
