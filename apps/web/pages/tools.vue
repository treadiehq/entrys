<script setup lang="ts">
import type { ToolResponse, CreateToolDto, CreateToolAliasDto } from '@entrys/shared'
import { z } from 'zod'

useHead({
  title: 'Tools - Entrys'
})

const { env } = useApi()
const { tools, toolsByLogicalName, loading, loadTools, createTool, updateTool, deleteTool, activateTool, deactivateTool } = useTools()
const { agents, loadAgents } = useAgents()
const { aliases, loading: aliasesLoading, loadAliases, createAlias, deleteAlias } = useAliases()
const toast = useToast()

const showModal = ref(false)
const editingTool = ref<ToolResponse | null>(null)
const formError = ref('')
const activatingId = ref<string | null>(null)
const openMenuId = ref<string | null>(null)
const openAliasMenuId = ref<string | null>(null)
const submitting = ref(false)

// Confirmation modals
const confirmDeleteTool = ref<{ show: boolean; tool: ToolResponse | null }>({ show: false, tool: null })
const confirmDeleteAlias = ref<{ show: boolean; id: string; alias: string }>({ show: false, id: '', alias: '' })
const confirmDeactivate = ref<{ show: boolean; tool: ToolResponse | null }>({ show: false, tool: null })

// Aliases
const showAliasModal = ref(false)
const aliasForm = ref<CreateToolAliasDto>({ alias: '', logicalName: '' })
const aliasError = ref('')
const aliasSubmitting = ref(false)

// Get unique logical names for alias dropdown
const logicalNames = computed(() => {
  const names = new Set<string>()
  tools.value.forEach(t => names.add(t.logicalName))
  return Array.from(names).sort()
})

function openAliasModal() {
  aliasForm.value = { alias: '', logicalName: logicalNames.value[0] || '' }
  aliasError.value = ''
  showAliasModal.value = true
}

async function submitAlias() {
  aliasError.value = ''
  aliasSubmitting.value = true
  
  if (!aliasForm.value.alias || !aliasForm.value.logicalName) {
    aliasError.value = 'Both fields are required'
    aliasSubmitting.value = false
    return
  }
  
  try {
    await createAlias(aliasForm.value)
    showAliasModal.value = false
    toast.success(`Alias "${aliasForm.value.alias}" created`)
  } catch (err: any) {
    aliasError.value = err?.data?.message || err?.message || 'Failed to create alias'
    toast.error('Failed to create alias')
  } finally {
    aliasSubmitting.value = false
  }
}

function openDeleteAliasModal(id: string, alias: string) {
  confirmDeleteAlias.value = { show: true, id, alias }
  openAliasMenuId.value = null
}

async function handleDeleteAlias(id: string, alias: string) {
  try {
    await deleteAlias(id)
    toast.success(`Alias "${alias}" deleted`)
    confirmDeleteAlias.value = { show: false, id: '', alias: '' }
  } catch (err) {
    toast.error('Failed to delete alias')
  }
}

// Close menu when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.actions-menu')) {
    openMenuId.value = null
    openAliasMenuId.value = null
  }
}

function toggleMenu(toolId: string) {
  openMenuId.value = openMenuId.value === toolId ? null : toolId
}

function toggleAliasMenu(aliasId: string) {
  openAliasMenuId.value = openAliasMenuId.value === aliasId ? null : aliasId
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Form state
const formData = ref<CreateToolDto & { allowedAgentIds: string[], redactionEnabled: boolean }>({
  logicalName: '',
  version: 'v1',
  displayName: '',
  type: 'http',
  method: 'POST',
  urlTemplate: '',
  headersJson: '',
  mcpToolName: '',
  allowAllAgents: true,
  allowedAgentIds: [],
  redactionEnabled: true,
})

// Get active (non-revoked) agents for selection
const activeAgents = computed(() => agents.value.filter(a => !a.isRevoked))

// Validation schema
const toolSchema = z.object({
  logicalName: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/, 'Must be lowercase alphanumeric with underscores'),
  version: z.string().min(1).max(20).regex(/^v\d+$/, 'Must be v1, v2, etc.'),
  displayName: z.string().min(1).max(200),
  type: z.enum(['http', 'mcp']).optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).optional(),
  urlTemplate: z.string().url().or(z.string().startsWith('http')),
  headersJson: z.string().optional(),
  mcpToolName: z.string().optional(),
  allowAllAgents: z.boolean().optional(),
  allowedAgentIds: z.array(z.string()).optional(),
  redactionEnabled: z.boolean().optional(),
})

function openCreateModal() {
  editingTool.value = null
  formData.value = {
    logicalName: '',
    version: 'v1',
    displayName: '',
    type: 'http',
    method: 'POST',
    urlTemplate: '',
    headersJson: '',
    mcpToolName: '',
    allowAllAgents: true,
    allowedAgentIds: [],
    redactionEnabled: true,
  }
  formError.value = ''
  showModal.value = true
}

function openEditModal(tool: ToolResponse) {
  editingTool.value = tool
  formData.value = {
    logicalName: tool.logicalName,
    version: tool.version,
    displayName: tool.displayName,
    type: tool.type,
    method: tool.method,
    urlTemplate: tool.urlTemplate,
    headersJson: tool.headersJson || '',
    mcpToolName: tool.mcpToolName || '',
    allowAllAgents: tool.allowAllAgents,
    allowedAgentIds: tool.allowedAgents?.map(a => a.agentKeyId) || [],
    redactionEnabled: tool.redactionEnabled,
  }
  formError.value = ''
  showModal.value = true
}

// Create a new version of an existing tool
function openNewVersionModal(tool: ToolResponse) {
  editingTool.value = null
  const currentVersion = parseInt(tool.version.replace('v', ''))
  formData.value = {
    logicalName: tool.logicalName,
    version: `v${currentVersion + 1}`,
    displayName: tool.displayName,
    type: tool.type,
    method: tool.method,
    urlTemplate: tool.urlTemplate,
    headersJson: tool.headersJson || '',
    mcpToolName: tool.mcpToolName || '',
    allowAllAgents: tool.allowAllAgents,
    allowedAgentIds: tool.allowedAgents?.map(a => a.agentKeyId) || [],
    redactionEnabled: tool.redactionEnabled,
  }
  formError.value = ''
  showModal.value = true
}

async function submitForm() {
  formError.value = ''
  submitting.value = true
  
  try {
    toolSchema.parse(formData.value)
  } catch (err) {
    if (err instanceof z.ZodError) {
      formError.value = err.errors.map(e => e.message).join(', ')
      submitting.value = false
      return
    }
  }
  
  try {
    if (editingTool.value) {
      await updateTool(editingTool.value.id, {
        displayName: formData.value.displayName,
        method: formData.value.method,
        urlTemplate: formData.value.urlTemplate,
        headersJson: formData.value.headersJson || undefined,
        mcpToolName: formData.value.mcpToolName || undefined,
        allowAllAgents: formData.value.allowAllAgents,
        allowedAgentIds: formData.value.allowAllAgents ? [] : formData.value.allowedAgentIds,
        redactionEnabled: formData.value.redactionEnabled,
      })
      toast.success('Tool updated successfully')
    } else {
      await createTool({
        ...formData.value,
        allowedAgentIds: formData.value.allowAllAgents ? [] : formData.value.allowedAgentIds,
      })
      toast.success(`Tool "${formData.value.logicalName}" created`)
    }
    showModal.value = false
  } catch (err: any) {
    formError.value = err?.data?.message || err?.message || 'Failed to save tool'
    toast.error('Failed to save tool')
  } finally {
    submitting.value = false
  }
}

function openDeleteToolModal(tool: ToolResponse) {
  confirmDeleteTool.value = { show: true, tool }
  openMenuId.value = null
}

async function handleDelete(tool: ToolResponse) {
  try {
    await deleteTool(tool.id)
    toast.success(`Tool "${tool.logicalName}" deleted`)
    confirmDeleteTool.value = { show: false, tool: null }
  } catch (err) {
    toast.error('Failed to delete tool')
  }
}

// Activate a tool version
async function handleActivate(tool: ToolResponse) {
  activatingId.value = tool.id
  try {
    await activateTool(tool.id)
    toast.success(`${tool.logicalName} ${tool.version} activated`)
  } catch (err) {
    toast.error('Failed to activate tool')
  } finally {
    activatingId.value = null
  }
}

// Deactivate a tool version
function openDeactivateModal(tool: ToolResponse) {
  confirmDeactivate.value = { show: true, tool }
  openMenuId.value = null
}

async function handleDeactivate(tool: ToolResponse) {
  activatingId.value = tool.id
  try {
    await deactivateTool(tool.id)
    toast.warning(`${tool.logicalName} ${tool.version} deactivated`)
    confirmDeactivate.value = { show: false, tool: null }
  } catch (err) {
    toast.error('Failed to deactivate tool')
  } finally {
    activatingId.value = null
  }
}

// Get the active version for a logical name
function getActiveVersion(logicalName: string): ToolResponse | undefined {
  return tools.value.find(t => t.logicalName === logicalName && t.isActive)
}

// Reload on env change
watch(env, () => {
  loadTools()
  loadAgents()
  loadAliases()
})
onMounted(() => {
  loadTools()
  loadAliases()
  loadAgents()
})
</script>

<template>
  <div class="p-8 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-xl font-semibold">Tools</h1>
        <p class="text-sm text-gray-400 mt-1">
          Manage tool backends with versioning. Agents call stable names, backends can change.
        </p>
      </div>
      <button class="btn btn-primary" @click="openCreateModal">
        + Add Tool
      </button>
    </div>

    <!-- Loading Skeleton -->
    <SkeletonTable v-if="loading" :rows="4" :cols="7" />

    <!-- Empty State -->
    <div v-else-if="tools.length === 0" class="card">
      <EmptyState
        icon="tools"
        title="No tools configured"
        description="Tools are HTTP endpoints that your agents can invoke. Add your first tool to start routing requests."
        actionLabel="+ Add Tool"
        @action="openCreateModal"
      />
    </div>

    <!-- Tools Table - Grouped by logical name -->
    <div v-else class="card">
      <table class="table">
        <thead>
          <tr>
            <th>Logical Name</th>
            <th>Version</th>
            <th>Type</th>
            <th>Status</th>
            <th>URL / Endpoint</th>
            <th>Updated</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(versions, logicalName) in toolsByLogicalName" :key="logicalName">
            <tr v-for="(tool, idx) in versions" :key="tool.id" :class="{ 'border border-gray-500/10': idx === 0 }">
              <td>
                <div class="font-mono text-sm">{{ tool.logicalName }}</div>
                <div class="text-xs text-gray-400">{{ tool.displayName }}</div>
              </td>
              <td>
                <span class="font-mono text-sm">{{ tool.version }}</span>
              </td>
              <td>
                <span v-if="tool.type === 'http'" class="badge badge-blue">HTTP</span>
                <span v-else class="badge badge-purple">MCP</span>
              </td>
              <td>
                <div class="flex items-center gap-2">
                  <span v-if="tool.isActive" class="badge badge-green">Active</span>
                  <span v-else class="badge">Inactive</span>
                </div>
              </td>
              <td class="font-mono text-xs max-w-xs truncate" :title="tool.urlTemplate">
                {{ tool.urlTemplate }}
              </td>
              <td class="text-xs text-gray-400">
                {{ new Date(tool.updatedAt).toLocaleDateString() }}
              </td>
              <td>
                <div class="actions-menu relative">
                  <button 
                    class="btn btn-secondary p-1.5!"
                    @click.stop="toggleMenu(tool.id)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                  
                  <!-- Dropdown Menu -->
                  <div 
                    v-if="openMenuId === tool.id"
                    class="absolute right-0 top-full mt-1 w-44 bg-black border border-gray-500/20 rounded-lg shadow-xl z-50 py-1 overflow-hidden"
                  >
                    <button 
                      v-if="!tool.isActive"
                      class="w-full px-4 py-2 text-left text-sm hover:bg-gray-500/20 flex items-center gap-2 text-green-300"
                      :disabled="activatingId === tool.id"
                      @click="handleActivate(tool); openMenuId = null"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      {{ activatingId === tool.id ? 'Activating...' : 'Activate' }}
                    </button>
                    <button 
                      v-else
                      class="w-full px-4 py-2 text-left text-sm hover:bg-gray-500/20 flex items-center gap-2 text-amber-300"
                      :disabled="activatingId === tool.id"
                      @click="openDeactivateModal(tool)"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      {{ activatingId === tool.id ? 'Deactivating...' : 'Deactivate' }}
                    </button>
                    
                    <div class="border-t border-gray-500/20 my-1"></div>
                    
                    <button 
                      class="w-full px-4 py-2 text-left text-sm hover:bg-gray-500/20 flex items-center gap-2"
                      @click="openEditModal(tool); openMenuId = null"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button 
                      class="w-full px-4 py-2 text-left text-sm hover:bg-gray-500/20 flex items-center gap-2"
                      @click="openNewVersionModal(tool); openMenuId = null"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      New Version
                    </button>
                    
                    <div class="border-t border-gray-500/20 my-1"></div>
                    
                    <button 
                      class="w-full px-4 py-2 text-left text-sm hover:bg-gray-500/20 flex items-center gap-2 text-red-400"
                      @click="openDeleteToolModal(tool)"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Aliases Section -->
    <div class="card mt-6">
      <div class="p-4 border-b border-gray-500/10 flex items-center justify-between">
        <h2 class="text-sm font-medium flex items-center gap-2">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span>Aliases</span>
          <span class="text-xs text-gray-500 font-normal ml-1">(optional shortcuts to tools)</span>
        </h2>
        <button 
          v-if="logicalNames.length > 0"
          class="btn btn-secondary text-xs px-2! py-1!"
          @click="openAliasModal"
        >
          + Add Alias
        </button>
      </div>
      
      <div v-if="aliasesLoading" class="p-4">
        <div class="skeleton h-8 w-full"></div>
      </div>
      
      <EmptyState
        v-else-if="aliases.length === 0"
        icon="alias"
        title="No aliases configured"
        description="Aliases let agents call tools by alternative names. Create shortcuts for commonly used tools."
        actionLabel="+ Add Alias"
        @action="openAliasModal"
      />
      
      <table v-else class="table">
        <thead>
          <tr>
            <th>Alias</th>
            <th>Points To</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="alias in aliases" :key="alias.id">
            <td class="font-mono text-sm">{{ alias.alias }}</td>
            <td>
              <div class="flex items-center gap-2">
                <svg class="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <span class="font-mono text-sm text-blue-300">{{ alias.logicalName }}</span>
              </div>
            </td>
            <td class="text-right">
              <div class="actions-menu relative inline-block">
                <button 
                  class="btn btn-secondary p-1.5!"
                  @click.stop="toggleAliasMenu(alias.id)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                
                <!-- Dropdown Menu -->
                <div 
                  v-if="openAliasMenuId === alias.id"
                  class="absolute right-0 top-full mt-1 w-40 bg-black border border-gray-500/20 rounded-lg shadow-xl z-50 py-1 overflow-hidden"
                >
                  <button 
                    class="w-full px-4 py-2 text-left text-sm hover:bg-gray-500/20 flex items-center gap-2 text-red-400"
                    @click="openDeleteAliasModal(alias.id, alias.alias)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Info Card -->
    <!-- <div class="card p-5 mt-6">
      <h3 class="text-sm font-medium mb-3 flex items-center gap-2">
        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>About Tool Versioning</span>
      </h3>
      <ul class="text-sm text-gray-400 space-y-1.5">
        <li>Agents call <code class="text-white bg-gray-500/15 px-1.5 py-0.5 rounded">/v1/invoke/logical_name</code> — the stable name never changes.</li>
        <li>Only <strong class="text-white">one version</strong> per logical name can be active at a time.</li>
        <li>Create new versions to change backends without modifying agent code.</li>
        <li>Use <strong class="text-white">MCP</strong> type to connect to Model Context Protocol servers.</li>
        <li><strong class="text-white">Aliases</strong> let agents call tools by alternative names.</li>
      </ul>
    </div> -->

    <!-- Alias Modal -->
    <div v-if="showAliasModal" class="modal-backdrop" @click.self="showAliasModal = false">
      <div class="modal max-w-sm">
        <h2 class="text-lg font-semibold mb-4">Create Alias</h2>
        
        <form @submit.prevent="submitAlias" class="space-y-4">
          <div>
            <label class="text-sm font-medium block mb-1">Alias Name</label>
            <input 
              v-model="aliasForm.alias"
              type="text"
              class="input font-mono"
              placeholder="send_email"
            />
            <p class="text-xs text-gray-400 mt-1">
              Lowercase with underscores only
            </p>
          </div>
          
          <div>
            <label class="text-sm font-medium block mb-1">Points To</label>
            <select v-model="aliasForm.logicalName" class="select w-full">
              <option v-for="name in logicalNames" :key="name" :value="name">
                {{ name }}
              </option>
            </select>
            <p class="text-xs text-gray-400 mt-1">
              The logical tool name this alias resolves to
            </p>
          </div>

          <div v-if="aliasError" class="text-sm text-red-400 bg-red-400/10 p-3 rounded-lg">
            {{ aliasError }}
          </div>
          
          <div class="flex gap-3 pt-2">
            <button type="submit" class="btn btn-primary flex-1" :disabled="aliasSubmitting">
              <Spinner v-if="aliasSubmitting" size="sm" />
              {{ aliasSubmitting ? 'Creating...' : 'Create Alias' }}
            </button>
            <button type="button" class="btn btn-secondary" @click="showAliasModal = false">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Tool Modal -->
    <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
      <div class="modal max-w-lg">
        <h2 class="text-lg font-semibold mb-4">
          {{ editingTool ? 'Edit Tool' : 'Create Tool' }}
        </h2>
        
        <form @submit.prevent="submitForm" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium block mb-1">Logical Name</label>
              <input 
                v-model="formData.logicalName"
                type="text"
                class="input"
                placeholder="get_customer"
                :disabled="!!editingTool"
              />
              <p class="text-xs text-gray-400 mt-1">
                Stable name agents call
              </p>
            </div>
            <div>
              <label class="text-sm font-medium block mb-1">Version</label>
              <input 
                v-model="formData.version"
                type="text"
                class="input font-mono"
                placeholder="v1"
                :disabled="!!editingTool"
              />
              <p class="text-xs text-gray-400 mt-1">
                e.g., v1, v2, v3
              </p>
            </div>
          </div>
          
          <div>
            <label class="text-sm font-medium block mb-1">Display Name</label>
            <input 
              v-model="formData.displayName"
              type="text"
              class="input"
              placeholder="Get Customer Data"
            />
          </div>
          
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="text-sm font-medium block mb-1">Type</label>
              <select v-model="formData.type" class="select w-full">
                <option value="http">HTTP</option>
                <option value="mcp">MCP</option>
              </select>
            </div>
            <div v-if="formData.type === 'http'">
              <label class="text-sm font-medium block mb-1">Method</label>
              <select v-model="formData.method" class="select w-full">
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div>
              <label class="text-sm font-medium block mb-1">Redaction</label>
              <label class="flex items-center gap-2 mt-2">
                <input 
                  v-model="formData.redactionEnabled"
                  type="checkbox"
                  class="w-4 h-4"
                />
                <span class="text-sm">PII scrub</span>
              </label>
            </div>
          </div>

          <div>
            <label class="text-sm font-medium block mb-1">
              {{ formData.type === 'mcp' ? 'MCP Server URL' : 'URL Template' }}
            </label>
            <input 
              v-model="formData.urlTemplate"
              type="text"
              class="input font-mono"
              :placeholder="formData.type === 'mcp' ? 'http://localhost:3002/mcp' : 'https://api.example.com/customers/{{id}}'"
            />
            <p class="text-xs text-gray-400 mt-1">
              <template v-if="formData.type === 'mcp'">The MCP server endpoint</template>
              <template v-else>Use &#123;&#123;param&#125;&#125; for path params</template>
            </p>
          </div>

          <div v-if="formData.type === 'mcp'">
            <label class="text-sm font-medium block mb-1">MCP Tool Name (optional)</label>
            <input 
              v-model="formData.mcpToolName"
              type="text"
              class="input font-mono"
              placeholder="search_docs"
            />
            <p class="text-xs text-gray-400 mt-1">
              Tool name on the MCP server (defaults to logical name)
            </p>
          </div>

          <div>
            <label class="text-sm font-medium block mb-1">Access Control</label>
            <label class="flex items-center gap-2 mb-2">
              <input 
                v-model="formData.allowAllAgents"
                type="checkbox"
                class="w-4 h-4"
              />
              <span class="text-sm">Allow all agents</span>
            </label>
            
            <div v-if="!formData.allowAllAgents" class="mt-2">
              <label class="text-xs text-gray-400 block mb-2">Select allowed agents:</label>
              <div v-if="activeAgents.length === 0" class="text-sm text-gray-400 bg-gray-500/10 p-3 rounded-lg">
                No active agents available. Create an agent key first.
              </div>
              <div v-else class="space-y-2 max-h-32 overflow-y-auto bg-gray-500/10 rounded-lg p-3">
                <label 
                  v-for="agent in activeAgents" 
                  :key="agent.id"
                  class="flex items-center gap-2 cursor-pointer hover:bg-gray-500/10 p-1 rounded"
                >
                  <input 
                    type="checkbox"
                    :value="agent.id"
                    v-model="formData.allowedAgentIds"
                    class="w-4 h-4"
                  />
                  <span class="text-sm">{{ agent.name }}</span>
                  <span class="text-xs text-gray-400 font-mono">{{ agent.keyPrefix }}...</span>
                </label>
              </div>
            </div>
          </div>
          
          <div v-if="formData.type === 'http'">
            <label class="text-sm font-medium block mb-1">Custom Headers (JSON, optional)</label>
            <textarea 
              v-model="formData.headersJson"
              class="input font-mono"
              rows="2"
              placeholder='{"Authorization": "Bearer xxx"}'
            />
          </div>

          <div v-if="formError" class="text-sm text-red-400 bg-red-400/10 p-3 rounded-lg">
            {{ formError }}
          </div>
          
          <div class="flex gap-3 pt-2">
            <button type="submit" class="btn btn-primary flex-1">
              {{ editingTool ? 'Update' : 'Create' }}
            </button>
            <button type="button" class="btn btn-secondary" @click="showModal = false">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Tool Confirmation Modal -->
    <div v-if="confirmDeleteTool.show" class="modal-backdrop" @click.self="confirmDeleteTool.show = false">
      <div class="modal max-w-md">
        <h2 class="text-lg font-semibold mb-4 flex items-center gap-2 text-red-400">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Delete Tool</span>
        </h2>
        
        <div class="mb-4">
          <p class="text-sm text-gray-300 mb-2">
            Are you sure you want to delete this tool?
          </p>
          <div class="bg-gray-500/10 border border-gray-500/20 rounded-lg p-3">
            <div class="font-medium text-white">{{ confirmDeleteTool.tool?.displayName }}</div>
            <div class="text-xs text-gray-400 font-mono mt-1">
              {{ confirmDeleteTool.tool?.logicalName }} {{ confirmDeleteTool.tool?.version }}
            </div>
          </div>
          <p class="text-xs text-red-400 mt-3">
            This action cannot be undone.
          </p>
        </div>
        
        <div class="flex gap-3 pt-2">
          <button 
            class="btn btn-danger flex-1"
            @click="handleDelete(confirmDeleteTool.tool!)"
          >
            Delete
          </button>
          <button 
            type="button" 
            class="btn btn-secondary"
            @click="confirmDeleteTool.show = false"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Alias Confirmation Modal -->
    <div v-if="confirmDeleteAlias.show" class="modal-backdrop" @click.self="confirmDeleteAlias.show = false">
      <div class="modal max-w-md">
        <h2 class="text-lg font-semibold mb-4 flex items-center gap-2 text-red-400">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Delete Alias</span>
        </h2>
        
        <div class="mb-4">
          <p class="text-sm text-gray-300 mb-2">
            Are you sure you want to delete this alias?
          </p>
          <div class="bg-gray-500/10 border border-gray-500/20 rounded-lg p-3">
            <div class="font-mono text-sm text-white">{{ confirmDeleteAlias.alias }}</div>
          </div>
          <p class="text-xs text-red-400 mt-3">
            This action cannot be undone.
          </p>
        </div>
        
        <div class="flex gap-3 pt-2">
          <button 
            class="btn btn-danger flex-1"
            @click="handleDeleteAlias(confirmDeleteAlias.id, confirmDeleteAlias.alias)"
          >
            Delete
          </button>
          <button 
            type="button" 
            class="btn btn-secondary"
            @click="confirmDeleteAlias.show = false"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Deactivate Tool Confirmation Modal -->
    <div v-if="confirmDeactivate.show" class="modal-backdrop" @click.self="confirmDeactivate.show = false">
      <div class="modal max-w-md">
        <h2 class="text-lg font-semibold mb-4 flex items-center gap-2 text-amber-400">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <span>Deactivate Tool</span>
        </h2>
        
        <div class="mb-4">
          <p class="text-sm text-gray-300 mb-2">
            Are you sure you want to deactivate this tool version?
          </p>
          <div class="bg-gray-500/10 border border-gray-500/20 rounded-lg p-3">
            <div class="font-medium text-white">{{ confirmDeactivate.tool?.displayName }}</div>
            <div class="text-xs text-gray-400 font-mono mt-1">
              {{ confirmDeactivate.tool?.logicalName }} {{ confirmDeactivate.tool?.version }}
            </div>
          </div>
          <p class="text-xs text-amber-400 mt-3">
            This will leave no active version for this logical name. Agents will not be able to invoke this tool until another version is activated.
          </p>
        </div>
        
        <div class="flex gap-3 pt-2">
          <button 
            class="btn bg-amber-500 hover:bg-amber-600 text-white flex-1"
            :disabled="activatingId === confirmDeactivate.tool?.id"
            @click="handleDeactivate(confirmDeactivate.tool!)"
          >
            <Spinner v-if="activatingId === confirmDeactivate.tool?.id" size="sm" />
            {{ activatingId === confirmDeactivate.tool?.id ? 'Deactivating...' : 'Deactivate' }}
          </button>
          <button 
            type="button" 
            class="btn btn-secondary"
            @click="confirmDeactivate.show = false"
            :disabled="activatingId === confirmDeactivate.tool?.id"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
