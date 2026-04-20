<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import type { AgentConfig } from '@shared/types'

const props = defineProps<{
  modelValue: string | null
  agents: AgentConfig[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const open = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const selectedAgent = computed(() =>
  props.modelValue ? props.agents.find((a) => a.id === props.modelValue) : null,
)

const displayLabel = computed(() => selectedAgent.value?.name ?? '默认助手')

function toggle(): void {
  open.value = !open.value
}

function select(agent: AgentConfig | null): void {
  emit('update:modelValue', agent?.id ?? null)
  open.value = false
}

function onClickOutside(event: MouseEvent): void {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div ref="dropdownRef" class="relative inline-block">
    <button
      type="button"
      class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none"
      @click="toggle"
    >
      <span class="font-medium">{{ displayLabel }}</span>
      <svg
        class="h-3.5 w-3.5 text-gray-400 transition-transform"
        :class="{ 'rotate-180': open }"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    <div
      v-if="open"
      class="absolute left-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
    >
      <div class="max-h-[300px] overflow-y-auto">
        <button
          type="button"
          class="flex w-full items-start gap-2.5 border-b border-gray-100 px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
          :class="{ 'bg-blue-50 border-l-2 border-l-blue-500': modelValue === null }"
          @click="select(null)"
        >
          <div class="min-w-0 flex-1">
            <div class="text-sm font-medium text-gray-900">默认助手</div>
            <div class="mt-0.5 truncate text-xs text-gray-500">使用默认配置的助手</div>
          </div>
        </button>

        <button
          v-for="agent in agents"
          :key="agent.id"
          type="button"
          class="flex w-full items-start gap-2.5 border-b border-gray-100 px-3 py-2.5 text-left last:border-b-0 transition-colors hover:bg-gray-50"
          :class="{ 'bg-blue-50 border-l-2 border-l-blue-500': modelValue === agent.id }"
          @click="select(agent)"
        >
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              <span class="text-sm font-medium text-gray-900">{{ agent.name }}</span>
              <span
                class="inline-flex shrink-0 items-center rounded-full px-1.5 py-px text-[10px] font-medium leading-none"
                :class="
                  agent.type === 'remote'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                "
              >
                {{ agent.type === 'remote' ? '远程' : '本地' }}
              </span>
              <span
                v-if="agent.manifest.requiredTools.length > 0"
                class="inline-flex shrink-0 items-center rounded-full bg-gray-100 px-1.5 py-px text-[10px] leading-none text-gray-500"
              >
                {{ agent.manifest.requiredTools.length }} 工具
              </span>
            </div>
            <div class="mt-0.5 truncate text-xs text-gray-500">
              {{ agent.description }}
            </div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
