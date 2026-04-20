<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import type { ModelInfo } from '@shared/types'

const props = defineProps<{
  modelValue: string | null
  models: ModelInfo[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isOpen = ref(false)
const containerRef = ref<HTMLDivElement | null>(null)

const selectedModel = computed(() => props.models.find((m) => m.id === props.modelValue))

const displayText = computed(() => selectedModel.value?.name ?? '未选择模型')

function toggle(): void {
  isOpen.value = !isOpen.value
}

function selectModel(modelId: string): void {
  emit('update:modelValue', modelId)
  isOpen.value = false
}

function handleClickOutside(event: MouseEvent): void {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="containerRef" class="relative">
    <button
      type="button"
      class="inline-flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors max-w-[220px]"
      @click="toggle"
    >
      <span class="truncate">{{ displayText }}</span>
      <svg
        class="shrink-0 h-3.5 w-3.5 text-gray-400 transition-transform"
        :class="isOpen ? 'rotate-180' : ''"
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

    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute z-50 mt-1 w-64 rounded-lg bg-white shadow-lg border border-gray-200 overflow-hidden"
      >
        <ul class="max-h-[300px] overflow-y-auto py-1">
          <li v-if="models.length === 0" class="px-3 py-2 text-sm text-gray-400">暂无可用模型</li>
          <li v-for="model in models" :key="model.id">
            <button
              type="button"
              class="w-full text-left px-3 py-2 text-sm transition-colors cursor-pointer"
              :class="
                model.id === modelValue
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              "
              @click="selectModel(model.id)"
            >
              <span class="block truncate">{{ model.name }}</span>
              <span
                class="block text-xs truncate"
                :class="model.id === modelValue ? 'text-blue-400' : 'text-gray-400'"
              >
                {{ model.providerName }}
              </span>
            </button>
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>
