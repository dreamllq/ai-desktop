<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useMcpConfigStore } from '@renderer/stores/mcpConfig'
import type { McpServerConfig, McpServerAddParams, McpTransportType } from '@shared/types'

const props = defineProps<{
  server?: McpServerConfig
  onCancel: () => void
  onSaved: () => void
}>()

const store = useMcpConfigStore()
const isEdit = computed(() => !!props.server)

const form = reactive({
  name: '',
  transportType: 'stdio' as McpTransportType,
  command: '',
  args: '',
  envVars: [] as { key: string; value: string }[],
  url: '',
  headers: [] as { key: string; value: string }[],
  enabled: true,
})

const expandedSections = reactive({
  basic: true,
  connection: true,
  advanced: false,
})

const errors = reactive({
  name: '',
  command: '',
  url: '',
})

const testing = ref(false)
const testResult = ref<{ success: boolean; toolCount?: number; error?: string } | null>(null)
const saving = ref(false)

onMounted(() => {
  if (props.server) {
    form.name = props.server.name
    form.transportType = props.server.transportType
    form.enabled = props.server.enabled

    if (props.server.transportType === 'stdio') {
      const config = props.server.config as {
        command: string
        args: string[]
        env?: Record<string, string>
      }
      form.command = config.command
      form.args = config.args.join(', ')
      if (config.env) {
        form.envVars = Object.entries(config.env).map(([key, value]) => ({ key, value }))
      }
    } else {
      const config = props.server.config as {
        url: string
        headers?: Record<string, string>
      }
      form.url = config.url
      if (config.headers) {
        form.headers = Object.entries(config.headers).map(([key, value]) => ({ key, value }))
      }
    }
  }
})

function addEnvVar(): void {
  form.envVars.push({ key: '', value: '' })
}

function removeEnvVar(index: number): void {
  form.envVars.splice(index, 1)
}

function addHeader(): void {
  form.headers.push({ key: '', value: '' })
}

function removeHeader(index: number): void {
  form.headers.splice(index, 1)
}

function validateForm(): boolean {
  errors.name = ''
  errors.command = ''
  errors.url = ''

  if (!form.name.trim()) {
    errors.name = '名称不能为空'
    return false
  }
  if (form.transportType === 'stdio' && !form.command.trim()) {
    errors.command = '命令不能为空'
    return false
  }
  if (form.transportType === 'sse' && !form.url.trim()) {
    errors.url = 'URL 不能为空'
    return false
  }
  return true
}

function buildAddParams(): McpServerAddParams {
  if (form.transportType === 'stdio') {
    const env = form.envVars.reduce<Record<string, string>>((acc, { key, value }) => {
      if (key.trim()) acc[key.trim()] = value
      return acc
    }, {})
    return {
      name: form.name,
      transportType: form.transportType,
      config: {
        command: form.command,
        args: form.args
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        ...(Object.keys(env).length > 0 ? { env } : {}),
      },
      enabled: form.enabled,
    }
  } else {
    const headers = form.headers.reduce<Record<string, string>>((acc, { key, value }) => {
      if (key.trim()) acc[key.trim()] = value
      return acc
    }, {})
    return {
      name: form.name,
      transportType: form.transportType,
      config: {
        url: form.url,
        ...(Object.keys(headers).length > 0 ? { headers } : {}),
      },
      enabled: form.enabled,
    }
  }
}

async function handleTestConnection(): Promise<void> {
  if (!validateForm()) return
  testing.value = true
  testResult.value = null
  try {
    const params = buildAddParams()
    testResult.value = await store.testConnection(params)
  } catch (err) {
    testResult.value = { success: false, error: String(err) }
  } finally {
    testing.value = false
  }
}

async function handleSubmit(): Promise<void> {
  if (!validateForm()) return

  saving.value = true
  try {
    if (isEdit.value && props.server) {
      const params = buildAddParams()
      const success = await store.editServer(props.server.id, params)
      if (success) {
        props.onSaved()
      }
    } else {
      const params = buildAddParams()
      const success = await store.addServer(params)
      if (success) {
        props.onSaved()
      }
    }
  } catch {
    // Error is handled by store, saving state will reset
  } finally {
    saving.value = false
  }
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
        {{ isEdit ? '编辑服务' : '新增服务' }}
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
              class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="例如：filesystem-server"
            />
            <p v-if="errors.name" class="mt-1 text-xs text-red-500">{{ errors.name }}</p>
          </div>

          <!-- 传输类型 -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">传输类型</label>
            <div class="flex gap-2">
              <button
                type="button"
                :class="[
                  'flex-1 px-3 py-1.5 text-sm font-medium rounded-md border transition-colors',
                  form.transportType === 'stdio'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
                ]"
                @click="form.transportType = 'stdio'"
              >
                stdio
              </button>
              <button
                type="button"
                :class="[
                  'flex-1 px-3 py-1.5 text-sm font-medium rounded-md border transition-colors',
                  form.transportType === 'sse'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
                ]"
                @click="form.transportType = 'sse'"
              >
                sse
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 连接配置 Section -->
      <div class="border-b border-gray-200">
        <button
          class="w-full flex items-center gap-2 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          @click="expandedSections.connection = !expandedSections.connection"
        >
          <span class="text-xs">{{ expandedSections.connection ? '▼' : '▶' }}</span>
          连接配置
        </button>
        <div v-show="expandedSections.connection" class="px-5 pb-4 space-y-3">
          <!-- stdio mode -->
          <template v-if="form.transportType === 'stdio'">
            <!-- 命令 -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">
                命令 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.command"
                type="text"
                class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="npx"
              />
              <p v-if="errors.command" class="mt-1 text-xs text-red-500">{{ errors.command }}</p>
            </div>

            <!-- 参数 -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">参数</label>
              <input
                v-model="form.args"
                type="text"
                class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="@modelcontextprotocol/server-filesystem, /path"
              />
              <p class="mt-0.5 text-xs text-gray-400">多个参数用逗号分隔</p>
            </div>

            <!-- 环境变量 -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-2">环境变量</label>
              <div class="space-y-2">
                <div
                  v-for="(_, index) in form.envVars"
                  :key="index"
                  class="flex items-center gap-2"
                >
                  <input
                    v-model="form.envVars[index].key"
                    type="text"
                    class="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Key"
                  />
                  <input
                    v-model="form.envVars[index].value"
                    type="text"
                    class="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Value"
                  />
                  <button
                    type="button"
                    class="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    @click="removeEnvVar(index)"
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
                @click="addEnvVar"
              >
                + 添加环境变量
              </button>
            </div>
          </template>

          <!-- sse mode -->
          <template v-if="form.transportType === 'sse'">
            <!-- URL -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">
                URL <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.url"
                type="text"
                class="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://..."
              />
              <p v-if="errors.url" class="mt-1 text-xs text-red-500">{{ errors.url }}</p>
            </div>

            <!-- Headers -->
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-2">请求头</label>
              <div class="space-y-2">
                <div
                  v-for="(_, index) in form.headers"
                  :key="index"
                  class="flex items-center gap-2"
                >
                  <input
                    v-model="form.headers[index].key"
                    type="text"
                    class="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Key"
                  />
                  <input
                    v-model="form.headers[index].value"
                    type="text"
                    class="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Value"
                  />
                  <button
                    type="button"
                    class="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    @click="removeHeader(index)"
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
                @click="addHeader"
              >
                + 添加请求头
              </button>
            </div>
          </template>
        </div>
      </div>

      <!-- 高级选项 Section -->
      <div class="border-b border-gray-200">
        <button
          class="w-full flex items-center gap-2 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          @click="expandedSections.advanced = !expandedSections.advanced"
        >
          <span class="text-xs">{{ expandedSections.advanced ? '▼' : '▶' }}</span>
          高级选项
          <span v-if="!expandedSections.advanced" class="text-xs text-gray-400 ml-1"
            >(点击展开)</span
          >
        </button>
        <div v-show="expandedSections.advanced" class="px-5 pb-4 space-y-3">
          <!-- 启用状态 toggle -->
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
    </div>

    <!-- Test result message -->
    <div
      v-if="testResult"
      :class="[
        'px-5 py-2 text-xs border-b',
        testResult.success
          ? 'bg-green-50 text-green-700 border-green-200'
          : 'bg-red-50 text-red-700 border-red-200',
      ]"
    >
      <template v-if="testResult.success">
        连接成功，发现 {{ testResult.toolCount }} 个工具
      </template>
      <template v-else>
        {{ testResult.error || '连接测试失败' }}
      </template>
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-end gap-3 px-5 py-3 border-t border-gray-200 bg-white">
      <button
        type="button"
        :disabled="testing"
        class="px-4 py-1.5 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        @click="handleTestConnection"
      >
        <span v-if="testing" class="flex items-center gap-1.5">
          <svg
            class="w-3.5 h-3.5 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          测试中...
        </span>
        <span v-else>测试连接</span>
      </button>
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
