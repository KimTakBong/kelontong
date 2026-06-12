// Minimal global toast queue. State is module-scoped (singleton) so any
// component can push a notification and the <ToastHost> renders them all.
export interface Toast {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

const toasts = ref<Toast[]>([])
let seq = 0

export function useToast() {
  function push(type: Toast['type'], message: string, timeout = 3500): void {
    const id = ++seq
    toasts.value.push({ id, type, message })
    if (timeout > 0) {
      setTimeout(() => dismiss(id), timeout)
    }
  }

  function dismiss(id: number): void {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return {
    toasts,
    dismiss,
    success: (msg: string) => push('success', msg),
    error: (msg: string) => push('error', msg),
    info: (msg: string) => push('info', msg),
  }
}
