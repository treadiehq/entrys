<script setup lang="ts">
definePageMeta({
  layout: 'landing'
})

useHead({
  title: 'Entrys - The entry point for agent tool calls'
})

const installTab = ref<'pnpm' | 'npm' | 'yarn' | 'curl'>('pnpm')
const codeTab = ref<'snippet' | 'playground'>('snippet')
const codeExampleTab = ref<'node' | 'curl'>('node')
const toast = useToast()

const installCommands = {
  pnpm: 'pnpm install',
  npm: 'npm install',
  yarn: 'yarn install',
  curl: 'curl -fsSL https://github.com/treadiehq/entrys | bash'
}

const codeExamples = {
  node: `import Entry from '@entrys/client';
const entry = new Entry({
  apiKey: process.env.ENTRYS_API_KEY
});
const result = await entry.invoke('get_customer', {
  params: { id: '123' }
});
console.log(result);
// { name: "Jane Doe", email: "[REDACTED]" }`,
  curl: `curl -X POST "https://api.entrys.co/v1/invoke/get_customer" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: $ENTRYS_API_KEY" \\
  -d '{"params": {"id": "123"}}'`
}

function copyInstallCommand() {
  navigator.clipboard.writeText(installCommands[installTab.value])
  toast.success('Copied to clipboard')
}

function copyCodeExample() {
  navigator.clipboard.writeText(codeExamples[codeExampleTab.value])
  toast.success('Copied to clipboard')
}

// Use CodeBlock's highlighting logic
function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function span(className: string, content: string): string {
  return `<span class="${className}">${content}</span>`
}

function highlightBash(code: string): string {
  const lines = code.split('\n')
  return lines.map(line => {
    let result = ''
    let i = 0
    
    while (i < line.length) {
      if (i === 0 && line.startsWith('curl')) {
        result += span('text-green-300', 'curl')
        i += 4
        continue
      }
      
      if (line[i] === '-' && i > 0 && line[i-1] === ' ' && /[A-Za-z]/.test(line[i+1] || '')) {
        const flag = '-' + line[i+1]
        result += span('text-yellow-200', flag)
        i += 2
        continue
      }
      
      if (line[i] === '"') {
        let end = line.indexOf('"', i + 1)
        if (end === -1) end = line.length
        const str = line.slice(i, end + 1)
        result += span('text-amber-200', escapeHtml(str))
        i = end + 1
        continue
      }
      
      if (line[i] === "'") {
        let end = line.lastIndexOf("'")
        if (end <= i) end = line.length
        const str = line.slice(i, end + 1)
        result += span('text-gray-300', escapeHtml(str))
        i = end + 1
        continue
      }
      
      if (line[i] === '\\' && i === line.length - 1) {
        result += span('text-gray-500', '\\')
        i++
        continue
      }
      
      result += escapeHtml(line[i])
      i++
    }
    
    return result
  }).join('\n')
}

function highlightTypeScript(code: string): string {
  // Handle comments first (they can span to end of line)
  const lines = code.split('\n')
  const processedLines = lines.map(line => {
    const commentIndex = line.indexOf('//')
    if (commentIndex === -1) {
      return highlightTypeScriptLine(line)
    }
    
    const codePart = line.slice(0, commentIndex)
    const commentPart = line.slice(commentIndex)
    return highlightTypeScriptLine(codePart) + span('text-gray-500', escapeHtml(commentPart))
  })
  
  return processedLines.join('\n')
}

function highlightTypeScriptLine(line: string): string {
  const tokens: { type: string; value: string }[] = []
  let i = 0
  
  while (i < line.length) {
    if (/\s/.test(line[i])) {
      let ws = ''
      while (i < line.length && /\s/.test(line[i])) {
        ws += line[i]
        i++
      }
      tokens.push({ type: 'ws', value: ws })
      continue
    }
    
    if (line[i] === "'") {
      let str = "'"
      i++
      while (i < line.length && line[i] !== "'") {
        str += line[i]
        i++
      }
      if (i < line.length) {
        str += "'"
        i++
      }
      tokens.push({ type: 'string', value: str })
      continue
    }
    
    if (/[a-zA-Z_$]/.test(line[i])) {
      let word = ''
      while (i < line.length && /[a-zA-Z0-9_$]/.test(line[i])) {
        word += line[i]
        i++
      }
      tokens.push({ type: 'word', value: word })
      continue
    }
    
    tokens.push({ type: 'punct', value: line[i] })
    i++
  }
  
  const keywords = new Set(['import', 'from', 'const', 'let', 'var', 'await', 'async', 'new', 'function', 'return', 'if', 'else', 'console'])
  
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
        result += span('text-yellow-200', token.value)
      } else if (token.value === 'console') {
        result += span('text-cyan-300', token.value)
      } else if (nextToken && nextToken.value === '(') {
        result += span('text-blue-300', token.value)
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

const highlightedCode = computed(() => {
  const code = codeExamples[codeExampleTab.value]
  const isTypeScript = codeExampleTab.value === 'node'
  // Ensure consistent rendering between server and client
  return isTypeScript ? highlightTypeScript(code) : highlightBash(code)
})
</script>

<template>
  <div class="flex-1 flex flex-col bg-black antialiased font-mono relative">
    <div class="radial-gradient absolute top-0 md:right-14 right-5"></div>
    <div class="flex-1 flex items-center flex-col justify-center">
      <header class="relative z-10 w-full max-w-xl mx-auto">
        <div class="py-16 pb-10">
          <div class="flex items-center justify-between mb-4 w-full">
            <div class="gap-3">
              <span class="font-semibold text-3xl text-white">entrys</span>
            </div>
            <div class="flex items-center gap-4">
              <a 
                href="https://github.com/treadiehq/entrys" 
                target="_blank"
                rel="noopener noreferrer"
                class="text-gray-400 hover:text-white transition-colors"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <NuxtLink 
                to="/login" 
                class="flex items-center gap-2 px-3 py-2 bg-gray-500/10 hover:bg-gray-500/20 border border-gray-500/20 rounded-lg text-xs text-white transition-colors"
              >
                <span>Sign In</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM6.75 9.25a.75.75 0 0 0 0 1.5h4.59l-2.1 1.95a.75.75 0 0 0 1.02 1.1l3.5-3.25a.75.75 0 0 0 0-1.1l-3.5-3.25a.75.75 0 1 0-1.02 1.1l2.1 1.95H6.75Z" clip-rule="evenodd" />
                </svg>
              </NuxtLink>
            </div>
          </div>
          <p class="text-gray-400 text-sm max-w-sm">Give your AI agents a single entry point to access internal APIs and tools.</p>
        </div>
      </header>
      <section class="max-w-xl w-full mx-auto py-16 pt-0 relative z-10">
        <div class="bg-gray-500/10 border border-gray-500/10 rounded-xl overflow-hidden relative z-10">
          <div class="bg-gray-500/10 border-b border-gray-500/10 px-4 py-1.5 flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded-full bg-red-400/80"></div>
                <div class="w-3 h-3 rounded-full bg-yellow-300/80"></div>
                <div class="w-3 h-3 rounded-full bg-green-300/80"></div>
              </div>
              <span class="text-sm text-gray-400 font-mono">app.ts</span>
              <div class="flex items-center gap-1 ml-4">
                <button
                  @click="codeExampleTab = 'node'"
                  class="px-3 py-1 text-xs font-medium rounded transition-colors"
                  :class="codeExampleTab === 'node' 
                    ? 'bg-gray-500/20 text-white' 
                    : 'text-gray-500 hover:text-gray-300'"
                >
                  Node
                </button>
                <button
                  @click="codeExampleTab = 'curl'"
                  class="px-3 py-1 text-xs font-medium rounded transition-colors"
                  :class="codeExampleTab === 'curl' 
                    ? 'bg-gray-500/20 text-white' 
                    : 'text-gray-500 hover:text-gray-300'"
                >
                  cURL
                </button>
              </div>
            </div>
            <button
              @click="copyCodeExample"
              class="p-2 text-gray-400 hover:text-white transition-colors"
              title="Copy to clipboard"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>

          <div class="bg-gray-500/10 p-6 h-[250px]">
            <pre class="text-sm font-mono text-gray-300 overflow-x-auto leading-relaxed"><code v-html="highlightedCode" :key="codeExampleTab"></code></pre>
          </div>
        </div>
        <div class="bg-gray-500/10 border border-gray-500/10 rounded-xl overflow-hidden relative z-10">
          <pre class="text-sm font-mono text-gray-300 overflow-x-auto leading-relaxed">
            <code>
              npm install @entrys/client
            </code>
          </pre>
        </div>
      </section>
    </div>

    <footer class="">
      <div class="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="border-t border-transparent flex flex-col md:flex-row items-center justify-between py-3">
          <div class="flex items-center justify-center gap-3 relative">
            <p class="text-xs leading-6 font-medium text-gray-500 xl:text-center">
              &copy; {{new Date().getFullYear()}} Treadie, Inc.
            </p>
          </div>
          <div
            class="flex space-x-6 items-center md:mt-0 mt-4"
          >
            <a
              href="https://discord.gg/KqdBcqRk5E"
              target="_blank"
              class="text-sm font-semibold leading-6 hover:text-blue-300 text-gray-500"
            >
              <svg viewBox="0 0 20 20" aria-hidden="true" class="h-5 w-5" fill="currentColor">
                <path d="M16.238 4.515a14.842 14.842 0 0 0-3.664-1.136.055.055 0 0 0-.059.027 10.35 10.35 0 0 0-.456.938 13.702 13.702 0 0 0-4.115 0 9.479 9.479 0 0 0-.464-.938.058.058 0 0 0-.058-.027c-1.266.218-2.497.6-3.664 1.136a.052.052 0 0 0-.024.02C1.4 8.023.76 11.424 1.074 14.782a.062.062 0 0 0 .024.042 14.923 14.923 0 0 0 4.494 2.272.058.058 0 0 0 .064-.02c.346-.473.654-.972.92-1.496a.057.057 0 0 0-.032-.08 9.83 9.83 0 0 1-1.404-.669.058.058 0 0 1-.029-.046.058.058 0 0 1 .023-.05c.094-.07.189-.144.279-.218a.056.056 0 0 1 .058-.008c2.946 1.345 6.135 1.345 9.046 0a.056.056 0 0 1 .059.007c.09.074.184.149.28.22a.058.058 0 0 1 .023.049.059.059 0 0 1-.028.046 9.224 9.224 0 0 1-1.405.669.058.058 0 0 0-.033.033.056.056 0 0 0 .002.047c.27.523.58 1.022.92 1.495a.056.056 0 0 0 .062.021 14.878 14.878 0 0 0 4.502-2.272.055.055 0 0 0 .016-.018.056.056 0 0 0 .008-.023c.375-3.883-.63-7.256-2.662-10.246a.046.046 0 0 0-.023-.021Zm-9.223 8.221c-.887 0-1.618-.814-1.618-1.814s.717-1.814 1.618-1.814c.908 0 1.632.821 1.618 1.814 0 1-.717 1.814-1.618 1.814Zm5.981 0c-.887 0-1.618-.814-1.618-1.814s.717-1.814 1.618-1.814c.908 0 1.632.821 1.618 1.814 0 1-.71 1.814-1.618 1.814Z"></path>
              </svg>
            </a>
            <a
              href="https://github.com/treadiehq/entrys"
              target="_blank"
              class="text-sm font-semibold leading-6 hover:text-blue-300 text-gray-500"
            >
              <svg
                aria-label="github"
                viewBox="0 0 14 14"
                class="h-4 w-4"
                fill="currentColor"
              >
                <path
                  d="M7 .175c-3.872 0-7 3.128-7 7 0 3.084 2.013 5.71 4.79 6.65.35.066.482-.153.482-.328v-1.181c-1.947.415-2.363-.941-2.363-.941-.328-.81-.787-1.028-.787-1.028-.634-.438.044-.416.044-.416.7.044 1.071.722 1.071.722.635 1.072 1.641.766 2.035.59.066-.459.24-.765.437-.94-1.553-.175-3.193-.787-3.193-3.456 0-.766.262-1.378.721-1.881-.065-.175-.306-.897.066-1.86 0 0 .59-.197 1.925.722a6.754 6.754 0 0 1 1.75-.24c.59 0 1.203.087 1.75.24 1.335-.897 1.925-.722 1.925-.722.372.963.131 1.685.066 1.86.46.48.722 1.115.722 1.88 0 2.691-1.641 3.282-3.194 3.457.24.219.481.634.481 1.29v1.926c0 .197.131.415.481.328C11.988 12.884 14 10.259 14 7.175c0-3.872-3.128-7-7-7z"
                  fill="currentColor"
                  fill-rule="evenodd"
                ></path>
              </svg>
            </a>
            <a
              href="https://twitter.com/treadieinc"
              target="_blank"
              class="hover:text-blue-300 text-gray-500"
            >
              <span class="sr-only">X formerly known as Twitter</span>
              <svg aria-label="X formerly known as Twitter" fill="currentColor" class="h-4 w-4" viewBox="0 0 22 20"><path d="M16.99 0H20.298L13.071 8.26L21.573 19.5H14.916L9.702 12.683L3.736 19.5H0.426L8.156 10.665L0 0H6.826L11.539 6.231L16.99 0ZM15.829 17.52H17.662L5.83 1.876H3.863L15.829 17.52Z" class="astro-3SDC4Q5U"></path></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
