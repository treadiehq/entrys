<script setup lang="ts">
import type { AuditLogResponse, ToolResponse, AgentKeyResponse } from '@entrys/shared'

useHead({
  title: 'Audit Log - Entrys'
})

const { env, fetchApi } = useApi()

const logs = ref<AuditLogResponse[]>([])
const tools = ref<ToolResponse[]>([])
const agents = ref<AgentKeyResponse[]>([])
const loading = ref(true)

// Filters
const filterTool = ref('')
const filterDecision = ref('')
const filterAgent = ref('')

// Pagination
const currentPage = ref(1)
const pageSize = 20
const totalLogs = ref(0)

const totalPages = computed(() => Math.ceil(totalLogs.value / pageSize))
const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return logs.value.slice(start, start + pageSize)
})

async function loadData() {
  loading.value = true
  try {
    const [logsData, toolsData, agentsData] = await Promise.all([
      fetchApi<AuditLogResponse[]>('/audit', { 
        query: { 
          limit: 500,
          tool: filterTool.value || undefined,
          decision: filterDecision.value || undefined,
          agentKeyId: filterAgent.value || undefined,
        } 
      }),
      fetchApi<ToolResponse[]>('/tools'),
      fetchApi<AgentKeyResponse[]>('/agent-keys'),
    ])
    logs.value = logsData
    totalLogs.value = logsData.length
    tools.value = toolsData
    agents.value = agentsData
    currentPage.value = 1
  } catch (err) {
    console.error('Failed to load data:', err)
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  loadData()
}

function clearFilters() {
  filterTool.value = ''
  filterDecision.value = ''
  filterAgent.value = ''
  loadData()
}

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// Reload on env change
watch(env, () => loadData())
onMounted(() => loadData())

function formatDate(date: string | Date) {
  return new Date(date).toLocaleString()
}

function getDecisionBadge(decision: string) {
  switch (decision) {
    case 'allow': return 'badge-green'
    case 'deny': return 'badge-red'
    case 'error': return 'badge-yellow'
    default: return 'badge-blue'
  }
}

function formatRedactions(redactions: { type: string; count: number }[]) {
  if (redactions.length === 0) return '-'
  return redactions.map(r => `${r.type}: ${r.count}`).join(', ')
}

// Get unique logical names for filter dropdown
const uniqueLogicalNames = computed(() => {
  const names = new Set<string>()
  tools.value.forEach(t => names.add(t.logicalName))
  return Array.from(names).sort()
})

// Detail modal
const selectedLog = ref<AuditLogResponse | null>(null)

function openDetail(log: AuditLogResponse) {
  selectedLog.value = log
}

function closeDetail() {
  selectedLog.value = null
}
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-xl font-semibold">Audit Log</h1>
      <p class="text-sm text-gray-400 mt-1">
        Complete history of all tool invocations with version tracking
      </p>
    </div>

    <!-- Filters -->
    <div class="card p-4 mb-6">
      <div class="flex flex-wrap gap-4 items-end">
        <div>
          <label class="text-xs font-medium text-gray-400 block mb-1">
            Tool
          </label>
          <select v-model="filterTool" class="select">
            <option value="">All tools</option>
            <option v-for="name in uniqueLogicalNames" :key="name" :value="name">
              {{ name }}
            </option>
          </select>
        </div>
        
        <div>
          <label class="text-xs font-medium text-gray-400 block mb-1">
            Decision
          </label>
          <select v-model="filterDecision" class="select">
            <option value="">All</option>
            <option value="allow">Allow</option>
            <option value="deny">Deny</option>
            <option value="error">Error</option>
          </select>
        </div>
        
        <div>
          <label class="text-xs font-medium text-gray-400 block mb-1">
            Agent
          </label>
          <select v-model="filterAgent" class="select">
            <option value="">All agents</option>
            <option v-for="agent in agents" :key="agent.id" :value="agent.id">
              {{ agent.name }} ({{ agent.keyPrefix }}...)
            </option>
          </select>
        </div>
        
        <button class="btn btn-primary" @click="applyFilters">
          Apply
        </button>
        <button class="btn btn-secondary" @click="clearFilters">
          Clear
        </button>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <SkeletonTable v-if="loading" :rows="8" :cols="5" />

    <!-- Empty State -->
    <div v-else-if="logs.length === 0" class="card">
      <EmptyState
        icon="logs"
        title="No audit logs"
        description="Every tool invocation is logged here with full request details, redactions applied, and latency metrics."
      />
    </div>

    <!-- Logs Table - Simplified with click to view details -->
    <div v-else class="card overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Tool</th>
            <th>Agent</th>
            <th>Decision</th>
            <th>Latency</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="log in paginatedLogs" 
            :key="log.id"
            class="cursor-pointer"
            @click="openDetail(log)"
          >
            <td class="text-xs whitespace-nowrap"><TimeAgo :date="log.createdAt" /></td>
            <td>
              <div class="font-mono text-sm">{{ log.toolName }}</div>
              <div v-if="log.logicalName" class="text-xs text-gray-400">
                → {{ log.logicalName }} {{ log.toolVersion }}
              </div>
            </td>
            <td class="text-sm text-gray-400">{{ log.agentLabel }}</td>
            <td>
              <span :class="['badge', getDecisionBadge(log.decision)]">
                {{ log.decision }}
              </span>
            </td>
            <td class="font-mono text-xs">{{ log.latencyMs }}ms</td>
          </tr>
        </tbody>
      </table>
      
      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-500/10">
        <div class="text-sm text-gray-400">
          Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, totalLogs) }} of {{ totalLogs }}
        </div>
        <div class="pagination">
          <button 
            class="pagination-btn"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            Previous
          </button>
          <template v-for="page in totalPages" :key="page">
            <button 
              v-if="page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)"
              class="pagination-btn"
              :class="{ 'pagination-btn-active': page === currentPage }"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
            <span 
              v-else-if="page === currentPage - 2 || page === currentPage + 2" 
              class="px-2 text-gray-500"
            >...</span>
          </template>
          <button 
            class="pagination-btn"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="selectedLog" class="modal-backdrop" @click.self="closeDetail">
      <div class="modal max-w-lg">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-semibold">Request Details</h2>
          <button 
            class="text-gray-400 hover:text-white transition-colors"
            @click="closeDetail"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-4">
          <!-- Status Badge -->
          <div class="flex items-center gap-3">
            <span :class="['badge', getDecisionBadge(selectedLog.decision)]">
              {{ selectedLog.decision }}
            </span>
            <span v-if="selectedLog.statusCode" class="font-mono text-sm" :class="selectedLog.statusCode >= 400 ? 'text-red-400' : ''">
              Status {{ selectedLog.statusCode }}
            </span>
            <span class="font-mono text-sm text-gray-400">{{ selectedLog.latencyMs }}ms</span>
          </div>

          <!-- Details Grid -->
          <div class="bg-gray-500/10 rounded-lg divide-y divide-gray-500/10">
            <div class="flex justify-between py-3 px-4">
              <span class="text-gray-400 text-sm">Time</span>
              <span class="text-sm">{{ formatDate(selectedLog.createdAt) }}</span>
            </div>
            <div class="flex justify-between py-3 px-4">
              <span class="text-gray-400 text-sm">Request ID</span>
              <span class="font-mono text-sm">{{ selectedLog.requestId }}</span>
            </div>
            <div class="flex justify-between py-3 px-4">
              <span class="text-gray-400 text-sm">Tool Called</span>
              <span class="font-mono text-sm">{{ selectedLog.toolName }}</span>
            </div>
            <div class="flex justify-between py-3 px-4">
              <span class="text-gray-400 text-sm">Resolved To</span>
              <div class="text-right">
                <span class="font-mono text-sm">{{ selectedLog.logicalName || '-' }}</span>
                <span v-if="selectedLog.toolVersion" class="text-gray-400 ml-1">{{ selectedLog.toolVersion }}</span>
                <span 
                  v-if="selectedLog.backendType" 
                  :class="['badge ml-2', selectedLog.backendType === 'mcp' ? 'badge-purple' : 'badge-blue']"
                >
                  {{ selectedLog.backendType }}
                </span>
              </div>
            </div>
            <div class="flex justify-between py-3 px-4">
              <span class="text-gray-400 text-sm">Agent</span>
              <span class="text-sm">{{ selectedLog.agentLabel }}</span>
            </div>
            <div class="flex justify-between py-3 px-4">
              <span class="text-gray-400 text-sm">Redactions</span>
              <span class="text-sm">{{ formatRedactions(selectedLog.redactions) }}</span>
            </div>
          </div>

        </div>

        <button 
          class="btn btn-secondary w-full mt-6"
          @click="closeDetail"
        >
          Close
        </button>
      </div>
    </div>

    <!-- Legend -->
    <!-- <div class="mt-6 flex flex-wrap gap-6 text-sm">
      <div class="flex items-center gap-2">
        <span class="badge badge-green">allow</span>
        <span class="text-gray-400">Request succeeded</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="badge badge-red">deny</span>
        <span class="text-gray-400">Unauthorized or rate limited</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="badge badge-yellow">error</span>
        <span class="text-gray-400">Upstream or validation error</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="badge badge-blue">http</span>
        <span class="text-gray-400">HTTP backend</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="badge badge-purple">mcp</span>
        <span class="text-gray-400">MCP backend</span>
      </div>
    </div> -->
  </div>
</template>
