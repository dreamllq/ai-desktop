<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useLlmConfigStore } from '@renderer/stores/llmConfig'
import type { LlmProviderListItem, LlmDefaultParams, LlmCustomHeader } from '@shared/types'

const props = defineProps<{
  provider?: LlmProviderListItem
  onCancel: () => void
  onSaved: () => void
}>()

const store = useLlmConfigStore()
const isEdit = computed(() => !!props.provider)

const form = reactive({
  name: '',
  apiKey: '',
  baseUrl: '',
  apiPath: '/v1/chat/completions',
  enabled: true,
  models: '',
  defaultModel: '',
  temperature: 0.7,
  maxTokens: 4096,
  topP: 1.0,
  frequencyPenalty: 0,
  presencePenalty: 0,
  proxy: '',
  timeout: 30000,
  customHeaders: [] as { key: string; value: string }[],
})

const expandedSections = reactive({
  basic: true,
  params: false,
  advanced: false,
})

const errors = reactive({
  name: '',
  baseUrl: '',
})

const showApiKey = ref(false)
const saving = ref(false)

onMounted(() => {
  if (props.provider) {
    form.name = props.provider.name
    form.apiKey = ''
    form.baseUrl = props.provider.baseUrl
    form.apiPath = props.provider.apiPath
    form.enabled = props.provider.enabled
    form.models = props.provider.models.join(', ')
    form.defaultModel = props.provider.defaultModel
    form.temperature = props.provider.defaultParams?.temperature ?? 0.7
    form.maxTokens = props.provider.defaultParams?.maxTokens ?? 4096
    form.topP = props.provider.defaultParams?.topP ?? 1.0
    form.frequencyPenalty = props.provider.defaultParams?.frequencyPenalty ?? 0
    form.presencePenalty = props.provider.defaultParams?.presencePenalty ?? 0
    form.proxy = props.provider.proxy
    form.timeout = props.provider.timeout
    form.customHeaders = props.provider.customHeaders.map((h) => ({ ...h }))
  }
})

function addCustomHeader(): void {
  form.customHeaders.push({ key: '', value: '' })
}

function removeCustomHeader(index: number): void {
  form.customHeaders.splice(index, 1)
}

function validate(): boolean {
  errors.name = ''
  errors.baseUrl = ''

  if (!form.name.trim()) {
    errors.name = '提供商名称不能为空'
    return false
  }
  if (form.baseUrl.trim()) {
    try {
      new URL(form.baseUrl)
    } catch {
      errors.baseUrl = 'URL 格式无效'
      return false
    }
  }
  return true
}

async function handleSubmit(): Promise<void> {
  if (!validate()) return

  saving.value = true

  const models = form.models
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const defaultParams: LlmDefaultParams = {
    temperature: form.temperature,
    maxTokens: form.maxTokens,
    topP: form.topP,
    frequencyPenalty: form.frequencyPenalty,
    presencePenalty: form.presencePenalty,
  }
  const customHeaders: LlmCustomHeader[] = form.customHeaders.filter((h) => h.key.trim())

  if (isEdit.value && props.provider) {
    const updates: Record<string, unknown> = {}
    if (form.name !== props.provider.name) updates.name = form.name
    if (form.apiKey) updates.apiKey = form.apiKey
    updates.enabled = form.enabled
    if (form.baseUrl !== props.provider.baseUrl) updates.baseUrl = form.baseUrl
    if (form.apiPath !== props.provider.apiPath) updates.apiPath = form.apiPath
    updates.models = models
    if (form.defaultModel !== props.provider.defaultModel) updates.defaultModel = form.defaultModel
    updates.defaultParams = defaultParams
    if (form.proxy !== props.provider.proxy) updates.proxy = form.proxy
    if (form.timeout !== props.provider.timeout) updates.timeout = form.timeout
    updates.customHeaders = customHeaders

    const success = await store.editProvider(props.provider.id, updates as Record<string, unknown>)
    if (success) {
      props.onSaved()
    }
  } else {
    const data = {
      name: form.name,
      apiKey: form.apiKey,
      enabled: form.enabled,
      baseUrl: form.baseUrl || undefined,
      apiPath: form.apiPath || undefined,
      models: models.length > 0 ? models : undefined,
      defaultModel: form.defaultModel || undefined,
      defaultParams,
      proxy: form.proxy || undefined,
      timeout: form.timeout,
      customHeaders: customHeaders.length > 0 ? customHeaders : undefined,
    }
    const success = await store.addProvider(data)
    if (success) {
      props.onSaved()
    }
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
        {{ isEdit ? '编辑提供商' : '新增提供商' }}
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
          <!-- Provider Name -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">
              提供商名称 <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="例如: OpenAI, Anthropic"
            />
            <p v-if="errors.name" class="mt-1 text-xs text-red-500">{{ errors.name }}</p>
          </div>

          <!-- API Key -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">
              API Key <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <input
                v-model="form.apiKey"
                :type="showApiKey ? 'text' : 'password'"
                class="w-full px-3 py-1.5 pr-9 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                :placeholder="isEdit ? '留空则不修改' : '输入 API Key'"
              />
              <button
                type="button"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                @click="showApiKey = !showApiKey"
              >
                <svg
                  v-if="!showApiKey"
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                  />
                </svg>
              </button>
            </div>
          </div>

          <!-- Base URL -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Base URL</label>
            <input
              v-model="form.baseUrl"
              type="text"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://api.openai.com"
            />
            <p v-if="errors.baseUrl" class="mt-1 text-xs text-red-500">{{ errors.baseUrl }}</p>
          </div>

          <!-- API Path -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">API 路径</label>
            <input
              v-model="form.apiPath"
              type="text"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="/v1/chat/completions"
            />
          </div>

          <!-- Enabled toggle -->
          <div class="flex items-center justify-between">
            <label class="text-xs font-medium text-gray-600">启用</label>
            <button
              type="button"
              :class="[
                'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none',
                form.enabled ? 'bg-blue-600' : 'bg-gray-300',
              ]"
              @click="form.enabled = !form.enabled"
            >
              <span
                :class="[
                  'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
                  form.enabled ? 'translate-x-4.5' : 'translate-x-0.5',
                ]"
              />
            </button>
          </div>
        </div>
      </div>

      <!-- 模型参数 Section -->
      <div class="border-b border-gray-200">
        <button
          class="w-full flex items-center gap-2 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          @click="expandedSections.params = !expandedSections.params"
        >
          <span class="text-xs">{{ expandedSections.params ? '▼' : '▶' }}</span>
          模型参数
          <span v-if="!expandedSections.params" class="text-xs text-gray-400 ml-1">(点击展开)</span>
        </button>
        <div v-show="expandedSections.params" class="px-5 pb-4 space-y-3">
          <!-- Available Models -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">可用模型</label>
            <input
              v-model="form.models"
              type="text"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="gpt-4, gpt-3.5-turbo, ..."
            />
            <p class="mt-0.5 text-xs text-gray-400">多个模型用逗号分隔</p>
          </div>

          <!-- Default Model -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">默认模型</label>
            <input
              v-model="form.defaultModel"
              type="text"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="gpt-4"
            />
          </div>

          <!-- Temperature -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-xs font-medium text-gray-600">Temperature</label>
              <span class="text-xs text-gray-500">{{ form.temperature.toFixed(1) }}</span>
            </div>
            <input
              v-model.number="form.temperature"
              type="range"
              min="0"
              max="2"
              step="0.1"
              class="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <!-- Max Tokens -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Max Tokens</label>
            <input
              v-model.number="form.maxTokens"
              type="number"
              min="1"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="4096"
            />
          </div>

          <!-- Top P -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-xs font-medium text-gray-600">Top P</label>
              <span class="text-xs text-gray-500">{{ form.topP.toFixed(1) }}</span>
            </div>
            <input
              v-model.number="form.topP"
              type="range"
              min="0"
              max="1"
              step="0.1"
              class="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <!-- Frequency Penalty -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Frequency Penalty</label>
            <input
              v-model.number="form.frequencyPenalty"
              type="number"
              min="0"
              max="2"
              step="0.1"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <!-- Presence Penalty -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Presence Penalty</label>
            <input
              v-model.number="form.presencePenalty"
              type="number"
              min="0"
              max="2"
              step="0.1"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <!-- 高级设置 Section -->
      <div class="border-b border-gray-200">
        <button
          class="w-full flex items-center gap-2 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          @click="expandedSections.advanced = !expandedSections.advanced"
        >
          <span class="text-xs">{{ expandedSections.advanced ? '▼' : '▶' }}</span>
          高级设置
          <span v-if="!expandedSections.advanced" class="text-xs text-gray-400 ml-1"
            >(点击展开)</span
          >
        </button>
        <div v-show="expandedSections.advanced" class="px-5 pb-4 space-y-3">
          <!-- Proxy -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">代理地址</label>
            <input
              v-model="form.proxy"
              type="text"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="http://127.0.0.1:7890"
            />
          </div>

          <!-- Timeout -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">超时时间 (ms)</label>
            <input
              v-model.number="form.timeout"
              type="number"
              min="1000"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="30000"
            />
          </div>

          <!-- Custom Headers -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-2">自定义请求头</label>
            <div class="space-y-2">
              <div
                v-for="(_, index) in form.customHeaders"
                :key="index"
                class="flex items-center gap-2"
              >
                <input
                  v-model="form.customHeaders[index].key"
                  type="text"
                  class="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Key"
                />
                <input
                  v-model="form.customHeaders[index].value"
                  type="text"
                  class="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Value"
                />
                <button
                  type="button"
                  class="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  @click="removeCustomHeader(index)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <button
              type="button"
              class="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
              @click="addCustomHeader"
            >
              + 添加请求头
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-end gap-3 px-5 py-3 border-t border-gray-200 bg-white">
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
