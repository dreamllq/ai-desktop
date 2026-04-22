<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useSkillConfigStore } from '@renderer/stores/skillConfig'
import type { SkillConfig } from '@shared/types'

const props = defineProps<{
  skill?: SkillConfig
  readOnly?: boolean
  onCancel: () => void
  onSaved: () => void
}>()

const store = useSkillConfigStore()
const isEdit = computed(() => !!props.skill)

const form = reactive({
  name: '',
  description: '',
  content: '',
})

const expandedSections = reactive({ basic: true, content: true })
const errors = reactive({ name: '', description: '' })
const saving = ref(false)
const contentManuallyEdited = ref(false)

function generateTemplate(): string {
  const name = form.name || '{技能名称}'
  const desc = form.description || '{技能描述}'
  return `---\nname: ${name}\nversion: 1.0.0\ndescription: ${desc}\nrequiredTools: []\n---\n\n# 在此编写技能指令...\n`
}

watch(
  () => [form.name, form.description],
  () => {
    if (!isEdit.value && !props.readOnly && !contentManuallyEdited.value) {
      form.content = generateTemplate()
    }
  }
)

onMounted(() => {
  if (props.skill) {
    form.name = props.skill.name
    form.description = props.skill.description
    form.content = props.skill.content
  } else if (!props.readOnly) {
    form.content = generateTemplate()
  }
})

function validate(): boolean {
  errors.name = ''
  errors.description = ''
  let valid = true
  if (!form.name.trim()) {
    errors.name = '名称不能为空'
    valid = false
  }
  if (!form.description.trim()) {
    errors.description = '描述不能为空'
    valid = false
  }
  return valid
}

async function handleSubmit(): Promise<void> {
  if (!validate()) return

  saving.value = true

  if (isEdit.value && props.skill) {
    const success = await store.editSkill(props.skill.id, {
      name: form.name,
      description: form.description,
      content: form.content,
    })
    if (success) props.onSaved()
  } else {
    const success = await store.createNewSkill({
      name: form.name,
      description: form.description,
      content: form.content,
    })
    if (success) props.onSaved()
  }

  saving.value = false
}
</script>

<template>
  <div class="flex flex-col h-full bg-gray-50">
    <!-- Header -->
    <div class="flex items-center gap-3 px-5 py-3 border-b border-gray-200 bg-white">
      <button
        class="text-gray-500 hover:text-gray-700 transition-colors"
        title="返回"
        @click="onCancel"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <h2 class="text-sm font-semibold text-gray-800">
        {{ readOnly ? `查看技能 — ${skill?.name}` : isEdit ? `编辑技能 — ${skill?.name}` : '创建技能' }}
      </h2>
    </div>

    <!-- Form body -->
    <div class="flex-1 overflow-y-auto">
      <!-- 基础信息 Section -->
      <div class="border-b border-gray-200">
        <button
          class="w-full flex items-center gap-2 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          @click="expandedSections.basic = !expandedSections.basic"
        >
          <span class="text-xs">{{ expandedSections.basic ? '▼' : '▶' }}</span>
          基础信息
        </button>
        <div v-show="expandedSections.basic" class="px-5 pb-4 space-y-3">
          <!-- 名称 -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">
              名称 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              :disabled="readOnly"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="例如：代码助手"
            />
            <p v-if="errors.name" class="mt-1 text-xs text-red-500">{{ errors.name }}</p>
          </div>

          <!-- 描述 -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">
              描述 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.description"
              type="text"
              :disabled="readOnly"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="简要描述技能的用途"
            />
            <p v-if="errors.description" class="mt-1 text-xs text-red-500">
              {{ errors.description }}
            </p>
          </div>
        </div>
      </div>

      <!-- 技能内容 Section -->
      <div class="border-b border-gray-200">
        <button
          class="w-full flex items-center gap-2 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          @click="expandedSections.content = !expandedSections.content"
        >
          <span class="text-xs">{{ expandedSections.content ? '▼' : '▶' }}</span>
          技能内容
        </button>
        <div v-show="expandedSections.content" class="px-5 pb-4">
          <p class="text-xs text-gray-400 mb-2">
            格式：YAML frontmatter（--- 包裹）+ Markdown 内容
          </p>
          <textarea
            v-model="form.content"
            :disabled="readOnly"
            class="w-full h-96 font-mono text-sm p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y disabled:bg-gray-100 disabled:text-gray-500"
            @input="contentManuallyEdited = true"
          ></textarea>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div
      v-if="!readOnly"
      class="flex items-center justify-end gap-3 px-5 py-3 border-t border-gray-200 bg-white"
    >
      <button
        type="button"
        class="px-4 py-1.5 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
        @click="onCancel"
      >
        取消
      </button>
      <button
        type="button"
        :disabled="saving"
        class="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        @click="handleSubmit"
      >
        {{ saving ? '保存中...' : '保存' }}
      </button>
    </div>
  </div>
</template>
