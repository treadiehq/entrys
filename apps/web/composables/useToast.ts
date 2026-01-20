interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number
}

const toasts = ref<Toast[]>([])

export function useToast() {
  function show(type: Toast['type'], message: string, duration = 4000) {
    const id = Math.random().toString(36).slice(2)
    const toast: Toast = { id, type, message, duration }
    toasts.value.push(toast)
    
    if (duration > 0) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }
    
    return id
  }
  
  function remove(id: string) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }
  
  function success(message: string, duration?: number) {
    return show('success', message, duration)
  }
  
  function error(message: string, duration?: number) {
    return show('error', message, duration)
  }
  
  function info(message: string, duration?: number) {
    return show('info', message, duration)
  }
  
  function warning(message: string, duration?: number) {
    return show('warning', message, duration)
  }
  
  return {
    toasts: readonly(toasts),
    show,
    remove,
    success,
    error,
    info,
    warning,
  }
}
