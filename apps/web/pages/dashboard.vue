<script setup lang="ts">
import type { ToolResponse, AuditLogResponse, AgentKeyResponse } from '@entrys/shared'

useHead({
  title: 'Dashboard - Entrys'
})

const { env, fetchApi } = useApi()
const config = useRuntimeConfig()

const tools = ref<ToolResponse[]>([])
const agents = ref<AgentKeyResponse[]>([])
const logs = ref<AuditLogResponse[]>([])
const loading = ref(true)

const selectedTool = ref<ToolResponse | null>(null)
const selectedAgent = ref<AgentKeyResponse | null>(null)
const showQuickstartModal = ref(false)
const codeTab = ref<'curl' | 'sdk'>('curl')

const toast = useToast()

function copyCommand() {
  const code = codeTab.value === 'curl' ? curlCommand.value : sdkCommand.value
  navigator.clipboard.writeText(code)
  toast.success('Code copied to clipboard')
}

async function loadData() {
  loading.value = true
  try {
    const [toolsData, agentsData, logsData] = await Promise.all([
      fetchApi<ToolResponse[]>('/tools'),
      fetchApi<AgentKeyResponse[]>('/agent-keys'),
      fetchApi<AuditLogResponse[]>('/audit', { query: { limit: 10 } }),
    ])
    tools.value = toolsData
    agents.value = agentsData.filter(a => !a.isRevoked)
    logs.value = logsData
    
    if (tools.value.length > 0) selectedTool.value = tools.value[0]
    if (agents.value.length > 0) selectedAgent.value = agents.value[0]
  } catch (err) {
    console.error('Failed to load data:', err)
  } finally {
    loading.value = false
  }
}

// Reload data when environment changes
watch(env, () => loadData())

onMounted(() => loadData())

// Generate curl command
const curlCommand = computed(() => {
  if (!selectedTool.value) return ''
  const tool = selectedTool.value
  const apiUrl = config.public.apiUrl || 'http://localhost:3001'
  
  const sampleBody = JSON.stringify({
    input: { message: 'Hello from agent!', email: 'user@example.com' },
  }, null, 2)
  
  return `curl -X POST "${apiUrl}/v1/invoke/${tool.logicalName}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_AGENT_KEY" \\
  -d '${sampleBody}'`
})

// Generate SDK command
const sdkCommand = computed(() => {
  if (!selectedTool.value) return ''
  const tool = selectedTool.value
  const apiUrl = config.public.apiUrl || 'http://localhost:3001'
  
  return `import { Entry } from '@entrys/client';

const entry = new Entry({
  apiKey: 'YOUR_AGENT_KEY',
  baseUrl: '${apiUrl}',
});

const result = await entry.invoke('${tool.logicalName}', {
  input: {
    message: 'Hello from agent!',
    email: 'user@example.com',
  },
});

console.log(result.data);`
})

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

// Detail modal for logs
const selectedLog = ref<AuditLogResponse | null>(null)

function openDetail(log: AuditLogResponse) {
  selectedLog.value = log
}

function closeDetail() {
  selectedLog.value = null
}

function formatRedactions(redactions: { type: string; count: number }[]) {
  if (redactions.length === 0) return '-'
  return redactions.map(r => `${r.type}: ${r.count}`).join(', ')
}

// Stats for charts
const stats = computed(() => {
  const allowed = logs.value.filter(l => l.decision === 'allow').length
  const denied = logs.value.filter(l => l.decision === 'deny').length
  const errored = logs.value.filter(l => l.decision === 'error').length
  const avgLatency = logs.value.length > 0 
    ? Math.round(logs.value.reduce((sum, l) => sum + l.latencyMs, 0) / logs.value.length)
    : 0
  return { allowed, denied, errored, avgLatency }
})
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-xl font-semibold">Dashboard</h1>
        <p class="text-sm text-gray-400 mt-1">
          Quick overview and getting started guide
        </p>
      </div>
      <button 
        class="btn btn-primary flex items-center gap-2"
        @click="showQuickstartModal = true"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Quickstart
      </button>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonTable class="lg:col-span-2" :rows="5" :cols="5" />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Stats Cards -->
      <div class="card p-5">
        <div class="flex items-center justify-between mb-3">
          <p class="text-sm text-gray-400">Tools</p>
          <NuxtLink to="/tools" class="text-xs text-blue-300 hover:underline">View →</NuxtLink>
        </div>
        <p class="text-3xl font-semibold">{{ tools.length }}</p>
      </div>

      <div class="card p-5">
        <div class="flex items-center justify-between mb-3">
          <p class="text-sm text-gray-400">Active Agents</p>
          <NuxtLink to="/agents" class="text-xs text-blue-300 hover:underline">View →</NuxtLink>
        </div>
        <p class="text-3xl font-semibold">{{ agents.length }}</p>
      </div>

      <div class="card p-5">
        <p class="text-sm text-gray-400 mb-3">Requests (Recent)</p>
        <div class="flex items-baseline gap-3">
          <p class="text-3xl font-semibold">{{ logs.length }}</p>
          <div class="flex items-center gap-2 text-xs">
            <span class="text-green-400">{{ stats.allowed }} ok</span>
            <span v-if="stats.denied > 0" class="text-red-400">{{ stats.denied }} denied</span>
          </div>
        </div>
      </div>

      <div class="card p-5">
        <p class="text-sm text-gray-400 mb-3">Avg Latency</p>
        <div class="flex items-baseline gap-2">
          <p class="text-3xl font-semibold">{{ stats.avgLatency }}</p>
          <span class="text-sm text-gray-400">ms</span>
        </div>
      </div>

      <!-- Recent Audit Logs -->
      <div class="card md:col-span-2 lg:col-span-4">
        <div class="p-4 border-b border-gray-500/10 flex items-center justify-between">
          <h2 class="text-sm font-medium flex items-center gap-2">
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span>Recent Activity</span>
          </h2>
          <NuxtLink to="/audit" class="text-sm text-blue-300 hover:underline">
            View all →
          </NuxtLink>
        </div>
        
        <EmptyState
          v-if="logs.length === 0"
          icon="activity"
          title="No activity yet"
          description="Once you invoke a tool through the gateway, requests will appear here in real-time."
        />
        
        <table v-else class="table">
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
              v-for="log in logs" 
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
      </div>
    </div>

    <!-- Quickstart Modal -->
    <div v-if="showQuickstartModal" class="modal-backdrop" @click.self="showQuickstartModal = false">
      <div class="modal max-w-2xl">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-semibold flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Quickstart</span>
          </h2>
          <button 
            class="text-gray-400 hover:text-white transition-colors"
            @click="showQuickstartModal = false"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- Has both tools and agents -->
        <template v-if="tools.length > 0 && agents.length > 0">
          <div class="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label class="text-xs font-medium text-gray-400 block mb-2">
                Select Tool
              </label>
              <select v-model="selectedTool" class="select w-full">
                <option v-for="tool in tools" :key="tool.id" :value="tool">
                  {{ tool.displayName }} ({{ tool.logicalName }})
                </option>
              </select>
            </div>
            <div>
              <label class="text-xs font-medium text-gray-400 block mb-2">
                Select Agent
              </label>
              <select v-model="selectedAgent" class="select w-full">
                <option v-for="agent in agents" :key="agent.id" :value="agent">
                  {{ agent.name }} ({{ agent.keyPrefix }}...)
                </option>
              </select>
            </div>
          </div>

          <div v-if="selectedTool">
            <!-- Code Tabs -->
            <div class="flex items-center gap-1 mb-3">
              <button
                @click="codeTab = 'curl'"
                class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                :class="codeTab === 'curl' 
                  ? 'bg-gray-500/20 text-white' 
                  : 'text-gray-400 hover:text-white'"
              >
                curl
              </button>
              <button
                @click="codeTab = 'sdk'"
                class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                :class="codeTab === 'sdk' 
                  ? 'bg-gray-500/20 text-white' 
                  : 'text-gray-400 hover:text-white'"
              >
                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 27.72 27.72 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 7.536 7.536 0 0 1 1.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z"/>
                </svg>
                TypeScript SDK
              </button>
            </div>

            <!-- Code Block -->
            <CodeBlock 
              :code="codeTab === 'curl' ? curlCommand : sdkCommand"
              :language="codeTab === 'curl' ? 'bash' : 'typescript'"
              @copy="copyCommand"
            />
            
            <p class="text-xs text-gray-400 mt-3 flex items-start gap-2">
              <svg class="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Replace <code class="text-white bg-gray-500/15 px-1 py-0.5 rounded">YOUR_AGENT_KEY</code> with your actual agent key.</span>
            </p>

            <p v-if="codeTab === 'sdk'" class="text-xs text-gray-500 mt-2">
              Install the SDK: <code class="text-gray-300 bg-gray-500/15 px-1.5 py-0.5 rounded">npm install @entrys/client</code>
            </p>
          </div>
        </template>

        <!-- Missing tools or agents -->
        <div v-else class="text-center py-10">
          <div class="relative inline-block mb-4">
            <div class="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-xl scale-150"></div>
            <div class="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50 flex items-center justify-center">
              <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </div>
          
          <template v-if="tools.length === 0 && agents.length === 0">
            <p class="text-white font-medium mb-1">Set up your gateway</p>
            <p class="text-sm text-gray-400 mb-5">Create a tool and an agent key to get started</p>
            <div class="flex items-center justify-center gap-3">
              <NuxtLink to="/tools" class="btn btn-primary text-sm">
                Create Tool
              </NuxtLink>
              <NuxtLink to="/agents" class="btn btn-secondary text-sm">
                Create Agent
              </NuxtLink>
            </div>
          </template>
          
          <template v-else-if="tools.length === 0">
            <p class="text-white font-medium mb-1">No tools configured</p>
            <p class="text-sm text-gray-400 mb-4">Create your first tool to generate a curl command</p>
            <NuxtLink to="/tools" class="btn btn-primary text-sm">
              Create Tool
            </NuxtLink>
          </template>
          
          <template v-else>
            <p class="text-white font-medium mb-1">No agent keys</p>
            <p class="text-sm text-gray-400 mb-4">Create an agent key to authenticate requests</p>
            <NuxtLink to="/agents" class="btn btn-primary text-sm">
              Create Agent Key
            </NuxtLink>
          </template>
        </div>
      </div>
    </div>

    <!-- Log Detail Modal -->
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
  </div>
</template>
