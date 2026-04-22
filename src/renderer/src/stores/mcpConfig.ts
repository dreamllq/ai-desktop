import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { McpServerConfig, McpServerAddParams, McpServerUpdateParams } from '@shared/types'
import { useMcp } from '@renderer/composables/useMcp'

export const useMcpConfigStore = defineStore('mcpConfig', () => {
  const servers = ref<McpServerConfig[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const serverStatuses = ref<Map<string, { connected: boolean; error?: string }>>(new Map())

  const mcpApi = useMcp()

  async function loadServers(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const result = await mcpApi.listMcpServers()
      if (result.success && result.data) {
        servers.value = result.data
      } else {
        error.value = result.error || '加载 MCP 服务失败'
      }
    } catch (err) {
      error.value = String(err)
    } finally {
      loading.value = false
    }
  }

  async function addServer(data: McpServerAddParams): Promise<boolean> {
    error.value = null
    try {
      const result = await mcpApi.addMcpServer(data)
      if (result.success) {
        await loadServers()
        return true
      }
      error.value = result.error || '添加 MCP 服务失败'
      return false
    } catch (err) {
      error.value = String(err)
      return false
    }
  }

  async function editServer(id: string, updates: McpServerUpdateParams): Promise<boolean> {
    error.value = null
    try {
      const result = await mcpApi.updateMcpServer(id, updates)
      if (result.success) {
        await loadServers()
        return true
      }
      error.value = result.error || '更新 MCP 服务失败'
      return false
    } catch (err) {
      error.value = String(err)
      return false
    }
  }

  async function removeServer(id: string): Promise<boolean> {
    error.value = null
    try {
      const result = await mcpApi.deleteMcpServer(id)
      if (result.success) {
        servers.value = servers.value.filter((s) => s.id !== id)
        serverStatuses.value.delete(id)
        return true
      }
      error.value = result.error || '删除 MCP 服务失败'
      return false
    } catch (err) {
      error.value = String(err)
      return false
    }
  }

  async function startServer(id: string): Promise<boolean> {
    error.value = null
    try {
      const result = await mcpApi.startMcpServer(id)
      if (result.success) {
        await loadServerStatus(id)
        return true
      }
      error.value = result.error || '启动 MCP 服务失败'
      return false
    } catch (err) {
      error.value = String(err)
      return false
    }
  }

  async function stopServer(id: string): Promise<boolean> {
    error.value = null
    try {
      const result = await mcpApi.stopMcpServer(id)
      if (result.success) {
        await loadServerStatus(id)
        return true
      }
      error.value = result.error || '停止 MCP 服务失败'
      return false
    } catch (err) {
      error.value = String(err)
      return false
    }
  }

  async function testConnection(
    params: McpServerAddParams,
  ): Promise<{ success: boolean; toolCount?: number; error?: string }> {
    try {
      const result = await mcpApi.testMcpConnection(params)
      if (result.success && result.data) {
        return { success: true, toolCount: result.data.toolCount }
      }
      return { success: false, error: result.error || '连接测试失败' }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }

  async function loadServerStatus(id: string): Promise<void> {
    try {
      const result = await mcpApi.getMcpServerStatus(id)
      if (result.success && result.data) {
        serverStatuses.value.set(id, result.data)
      }
    } catch {
      /* ignore */
    }
  }

  async function loadAllStatuses(): Promise<void> {
    for (const server of servers.value) {
      await loadServerStatus(server.id)
    }
  }

  return {
    servers,
    loading,
    error,
    serverStatuses,
    loadServers,
    addServer,
    editServer,
    removeServer,
    startServer,
    stopServer,
    testConnection,
    loadServerStatus,
    loadAllStatuses,
  }
})
