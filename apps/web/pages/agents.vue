<script setup lang="ts">
import type { AgentKeyResponse, AgentKeyCreatedResponse, CreateAgentKeyDto } from '@entrys/shared'
import { z } from 'zod'

useHead({
  title: 'Agents - Entrys'
})

const { env } = useApi()
const { agents, loading, loadAgents, createAgent, revokeAgent } = useAgents()
const toast = useToast()

const showModal = ref(false)
const showKeyModal = ref(false)
const newKey = ref('')
const formError = ref('')
const openMenuId = ref<string | null>(null)
const submitting = ref(false)
const revokingId = ref<string | null>(null)

// Confirmation modal
const confirmRevoke = ref<{ show: boolean; agent: AgentKeyResponse | null }>({ show: false, agent: null })

// Close menu when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.actions-menu')) {
    openMenuId.value = null
  }
}

function toggleMenu(agentId: string) {
  openMenuId.value = openMenuId.value === agentId ? null : agentId
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  loadAgents()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Form state
const formData = ref<CreateAgentKeyDto>({
  name: '',
})

// Validation schema
const agentSchema = z.object({
  name: z.string().min(1).max(100),
})

function openCreateModal() {
  formData.value = { name: '' }
  formError.value = ''
  showModal.value = true
}

async function submitForm() {
  formError.value = ''
  submitting.value = true
  
  try {
    agentSchema.parse(formData.value)
  } catch (err) {
    if (err instanceof z.ZodError) {
      formError.value = err.errors.map(e => e.message).join(', ')
      submitting.value = false
      return
    }
  }
  
  try {
    const result = await createAgent(formData.value)
    showModal.value = false
    newKey.value = result.plainKey
    showKeyModal.value = true
    toast.success(`Agent "${formData.value.name}" created successfully`)
  } catch (err: any) {
    formError.value = err?.data?.message || err?.message || 'Failed to create agent key'
    toast.error('Failed to create agent key')
  } finally {
    submitting.value = false
  }
}

function openRevokeModal(agent: AgentKeyResponse) {
  confirmRevoke.value = { show: true, agent }
  openMenuId.value = null
}

async function handleRevoke(agent: AgentKeyResponse) {
  revokingId.value = agent.id
  try {
    await revokeAgent(agent.id)
    toast.success(`Agent "${agent.name}" revoked`)
    confirmRevoke.value = { show: false, agent: null }
  } catch (err) {
    toast.error('Failed to revoke agent key')
  } finally {
    revokingId.value = null
  }
}

function copyKey() {
  navigator.clipboard.writeText(newKey.value)
  toast.success('Key copied to clipboard')
}

function copyPrefix(prefix: string) {
  navigator.clipboard.writeText(prefix)
  toast.info('Prefix copied to clipboard')
}

// Reload on env change
watch(env, () => loadAgents())
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-xl font-semibold">Agents</h1>
        <p class="text-sm text-gray-400 mt-1">
          Connected agents across your environments
        </p>
      </div>
      <button class="btn btn-primary" @click="openCreateModal">
        + Create Key
      </button>
    </div>

    <!-- Loading Skeleton -->
    <SkeletonTable v-if="loading" :rows="3" :cols="6" />

    <!-- Empty State -->
    <div v-else-if="agents.length === 0" class="card">
      <EmptyState
        icon="agents"
        title="No agent keys yet"
        description="Agent keys authenticate your AI agents when they invoke tools through the gateway."
        actionLabel="+ Create Key"
        @action="openCreateModal"
      />
    </div>

    <!-- Agents Table -->
    <div v-else class="card">
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Key Prefix</th>
            <th>Status</th>
            <th>Last Used</th>
            <th>Created</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="agent in agents" :key="agent.id">
            <td class="font-medium">{{ agent.name }}</td>
            <td class="font-mono text-sm text-gray-400">
              {{ agent.keyPrefix }}...
            </td>
            <td>
              <span v-if="agent.isRevoked" class="badge badge-red">Revoked</span>
              <span v-else class="badge badge-green">Active</span>
            </td>
            <td class="text-xs text-gray-400">
              <TimeAgo v-if="agent.lastUsedAt" :date="agent.lastUsedAt" />
              <span v-else>Never</span>
            </td>
            <td class="text-xs text-gray-400">
              <TimeAgo :date="agent.createdAt" />
            </td>
            <td>
              <div v-if="!agent.isRevoked" class="actions-menu relative">
                <button 
                  class="btn btn-secondary p-1.5!"
                  @click.stop="toggleMenu(agent.id)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                
                <!-- Dropdown Menu -->
                <div 
                  v-if="openMenuId === agent.id"
                  class="absolute right-0 top-full mt-1 w-40 bg-black border border-gray-500/20 rounded-lg shadow-xl z-50 py-1 overflow-hidden"
                >
                  <button 
                    class="w-full px-4 py-2 text-left text-sm hover:bg-gray-500/20 flex items-center gap-2"
                    @click="copyPrefix(agent.keyPrefix); openMenuId = null"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Prefix
                  </button>
                  
                  <div class="border-t border-gray-500/20 my-1"></div>
                  
                  <button 
                    class="w-full px-4 py-2 text-left text-sm hover:bg-gray-500/20 flex items-center gap-2 text-red-400"
                    @click="openRevokeModal(agent)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    Revoke
                  </button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Info Card -->
    <div class="card p-5 mt-6">
      <h3 class="text-sm font-medium mb-3 flex items-center gap-2">
        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>About Agent Keys</span>
      </h3>
      <ul class="text-sm text-gray-400 space-y-1.5">
        <li>Use the key in the <code class="text-white bg-gray-500/15 px-1.5 py-0.5 rounded">x-api-key</code> header when invoking tools.</li>
        <li>Rate limit: 60 requests per minute per agent/tool combination.</li>
      </ul>
    </div>

    <!-- Create Modal -->
    <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
      <div class="modal">
        <h2 class="text-lg font-semibold mb-4">Create Agent Key</h2>
        
        <form @submit.prevent="submitForm" class="space-y-4">
          <div>
            <label class="text-sm font-medium block mb-1">Name</label>
            <input 
              v-model="formData.name"
              type="text"
              class="input"
              placeholder="my-ai-agent"
            />
            <p class="text-xs text-gray-400 mt-1">
              A descriptive name to identify this agent
            </p>
          </div>

          <div v-if="formError" class="text-sm text-red-400 bg-red-400/10 p-3 rounded-lg">
            {{ formError }}
          </div>
          
          <div class="flex gap-3 pt-2">
            <button type="submit" class="btn btn-primary flex-1" :disabled="submitting">
              <Spinner v-if="submitting" size="sm" />
              {{ submitting ? 'Creating...' : 'Create Key' }}
            </button>
            <button type="button" class="btn btn-secondary" @click="showModal = false" :disabled="submitting">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Key Display Modal -->
    <div v-if="showKeyModal" class="modal-backdrop">
      <div class="modal">
        <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          <span>Agent Key Created</span>
        </h2>
        
        <div class="bg-amber-300/10 border border-amber-300/10 rounded-lg p-4 mb-4">
          <p class="text-sm text-amber-300 font-medium">
            This key will only be shown once. Copy it now!
          </p>
        </div>
        
        <div class="flex items-center gap-3 bg-gray-500/15 border border-gray-500/10 rounded-lg p-2 mb-4">
          <code class="text-sm break-all flex-1 font-mono">{{ newKey }}</code>
          <button 
            class="btn btn-secondary px-2 text-xs shrink-0"
            @click="copyKey"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4">
              <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12A1.5 1.5 0 0 1 17 6.622V12.5a1.5 1.5 0 0 1-1.5 1.5h-1v-3.379a3 3 0 0 0-.879-2.121L10.5 5.379A3 3 0 0 0 8.379 4.5H7v-1Z" />
              <path d="M4.5 6A1.5 1.5 0 0 0 3 7.5v9A1.5 1.5 0 0 0 4.5 18h7a1.5 1.5 0 0 0 1.5-1.5v-5.879a1.5 1.5 0 0 0-.44-1.06L9.44 6.439A1.5 1.5 0 0 0 8.378 6H4.5Z" />
            </svg>
          </button>
        </div>
        
        <button 
          class="btn btn-primary w-full"
          @click="showKeyModal = false; newKey = ''"
        >
          I've copied the key
        </button>
      </div>
    </div>

    <!-- Revoke Confirmation Modal -->
    <div v-if="confirmRevoke.show" class="modal-backdrop" @click.self="confirmRevoke.show = false">
      <div class="modal max-w-md">
        <h2 class="text-lg font-semibold mb-4 flex items-center gap-2 text-red-400">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <span>Revoke Agent Key</span>
        </h2>
        
        <div class="mb-4">
          <p class="text-sm text-gray-300 mb-2">
            Are you sure you want to revoke this agent key?
          </p>
          <div class="bg-gray-500/10 border border-gray-500/20 rounded-lg p-3">
            <div class="font-medium text-white">{{ confirmRevoke.agent?.name }}</div>
            <div class="text-xs text-gray-400 font-mono mt-1">
              {{ confirmRevoke.agent?.keyPrefix }}...
            </div>
          </div>
          <p class="text-xs text-red-400 mt-3">
            This action cannot be undone. The agent will no longer be able to invoke tools.
          </p>
        </div>
        
        <div class="flex gap-3 pt-2">
          <button 
            class="btn btn-danger flex-1"
            :disabled="revokingId === confirmRevoke.agent?.id"
            @click="handleRevoke(confirmRevoke.agent!)"
          >
            <Spinner v-if="revokingId === confirmRevoke.agent?.id" size="sm" />
            {{ revokingId === confirmRevoke.agent?.id ? 'Revoking...' : 'Revoke' }}
          </button>
          <button 
            type="button" 
            class="btn btn-secondary"
            @click="confirmRevoke.show = false"
            :disabled="revokingId === confirmRevoke.agent?.id"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
