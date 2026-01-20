<script setup lang="ts">
const props = defineProps<{
  code: string
  language: 'bash' | 'typescript'
}>()

defineEmits<{
  copy: []
}>()

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function span(className: string, content: string): string {
  return `<span class="${className}">${content}</span>`
}

const highlightedCode = computed(() => {
  const code = props.code
  
  if (props.language === 'bash') {
    return highlightBash(code)
  } else {
    return highlightTypeScript(code)
  }
})

function highlightBash(code: string): string {
  const lines = code.split('\n')
  
  return lines.map(line => {
    let result = ''
    let i = 0
    
    while (i < line.length) {
      // Check for curl at start
      if (i === 0 && line.startsWith('curl')) {
        result += span('text-green-300', 'curl')
        i += 4
        continue
      }
      
      // Check for flags like -X, -H, -d
      if (line[i] === '-' && i > 0 && line[i-1] === ' ' && /[A-Za-z]/.test(line[i+1] || '')) {
        const flag = '-' + line[i+1]
        result += span('text-yellow-300', flag)
        i += 2
        continue
      }
      
      // Check for double-quoted strings
      if (line[i] === '"') {
        let end = line.indexOf('"', i + 1)
        if (end === -1) end = line.length
        const str = line.slice(i, end + 1)
        result += span('text-amber-300', escapeHtml(str))
        i = end + 1
        continue
      }
      
      // Check for single-quoted strings (JSON body)
      if (line[i] === "'") {
        let end = line.lastIndexOf("'")
        if (end <= i) end = line.length
        const str = line.slice(i, end + 1)
        result += highlightJsonBody(str)
        i = end + 1
        continue
      }
      
      // Backslash at end
      if (line[i] === '\\' && i === line.length - 1) {
        result += span('text-gray-500', '\\')
        i++
        continue
      }
      
      // Regular character
      result += escapeHtml(line[i])
      i++
    }
    
    return result
  }).join('\n')
}

function highlightJsonBody(str: string): string {
  // Remove quotes
  const inner = str.slice(1, -1)
  let result = span('text-gray-400', "'")
  
  // Simple JSON highlighting
  let highlighted = escapeHtml(inner)
    .replace(/&quot;(\w+)&quot;:/g, span('text-blue-300', '"$1"') + ':')
    .replace(/: &quot;([^&]*)&quot;/g, ': ' + span('text-green-300', '"$1"'))
  
  // Actually, let's just escape and color it simply
  highlighted = escapeHtml(inner)
  
  result += span('text-gray-300', highlighted)
  result += span('text-gray-400', "'")
  return result
}

function highlightTypeScript(code: string): string {
  const tokens: { type: string; value: string }[] = []
  let i = 0
  
  while (i < code.length) {
    // Whitespace
    if (/\s/.test(code[i])) {
      let ws = ''
      while (i < code.length && /\s/.test(code[i])) {
        ws += code[i]
        i++
      }
      tokens.push({ type: 'ws', value: ws })
      continue
    }
    
    // Single-quoted string
    if (code[i] === "'") {
      let str = "'"
      i++
      while (i < code.length && code[i] !== "'") {
        str += code[i]
        i++
      }
      if (i < code.length) {
        str += "'"
        i++
      }
      tokens.push({ type: 'string', value: str })
      continue
    }
    
    // Word (identifier/keyword)
    if (/[a-zA-Z_$]/.test(code[i])) {
      let word = ''
      while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) {
        word += code[i]
        i++
      }
      tokens.push({ type: 'word', value: word })
      continue
    }
    
    // Punctuation
    tokens.push({ type: 'punct', value: code[i] })
    i++
  }
  
  // Now colorize tokens
  const keywords = new Set(['import', 'from', 'const', 'let', 'var', 'await', 'async', 'new', 'function', 'return', 'if', 'else'])
  
  let result = ''
  for (let j = 0; j < tokens.length; j++) {
    const token = tokens[j]
    const nextToken = tokens[j + 1]
    
    if (token.type === 'ws') {
      result += token.value
    } else if (token.type === 'string') {
      result += span('text-green-300', escapeHtml(token.value))
    } else if (token.type === 'word') {
      if (keywords.has(token.value)) {
        result += span('text-purple-300', token.value)
      } else if (/^[A-Z]/.test(token.value)) {
        result += span('text-yellow-300', token.value)
      } else if (token.value === 'console') {
        result += span('text-cyan-300', token.value)
      } else if (nextToken && nextToken.value === '(') {
        result += span('text-blue-300', token.value)
      } else if (nextToken && nextToken.value === ':') {
        result += span('text-red-300', token.value)
      } else {
        result += span('text-gray-200', token.value)
      }
    } else if (token.type === 'punct') {
      if (token.value === ';') {
        result += span('text-gray-500', ';')
      } else if ('{}[]()'.includes(token.value)) {
        result += span('text-gray-400', token.value)
      } else if (token.value === '.') {
        result += span('text-gray-400', '.')
      } else {
        result += escapeHtml(token.value)
      }
    }
  }
  
  return result
}
</script>

<template>
  <div class="code-block-container bg-gray-500/5 border border-gray-500/20 rounded-lg overflow-hidden">
    <div class="code-block-header bg-gray-500/10 border-b border-gray-500/20">
      <span class="code-block-lang">{{ language }}</span>
      <button 
        class="code-block-copy"
        @click="$emit('copy')"
        title="Copy to clipboard"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
    </div>
    <pre class="code-block-pre"><code v-html="highlightedCode"></code></pre>
  </div>
</template>

<style scoped>
/* .code-block-container {
  background: #0d1117;
  border: 1px solid rgba(139, 148, 158, 0.2);
  border-radius: 8px;
  overflow: hidden;
} */

.code-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  /* border-bottom: 1px solid rgba(139, 148, 158, 0.2);
  background: rgba(139, 148, 158, 0.05); */
}

.code-block-lang {
  font-size: 12px;
  color: #8b949e;
  font-weight: 500;
}

.code-block-copy {
  color: #8b949e;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.15s;
}

.code-block-copy:hover {
  color: #fff;
  background: rgba(139, 148, 158, 0.2);
}

.code-block-pre {
  padding: 16px;
  margin: 0;
  font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  overflow-x: auto;
  color: #c9d1d9;
}
</style>
