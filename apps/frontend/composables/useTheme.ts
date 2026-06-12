// Dark / light theme. State is module-scoped (singleton) and applied by toggling
// a `dark` class on <html>; CSS variables in main.css do the rest. Persisted to
// localStorage and seeded from the OS preference on first visit.
export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'klontong-theme'
const theme = ref<Theme>('light')

function apply(next: Theme): void {
  theme.value = next
  if (import.meta.client) {
    document.documentElement.classList.toggle('dark', next === 'dark')
    localStorage.setItem(STORAGE_KEY, next)
  }
}

export function useTheme() {
  function toggle(): void {
    apply(theme.value === 'dark' ? 'light' : 'dark')
  }

  // Called once on startup (theme.client plugin) before the app renders.
  function init(): void {
    if (!import.meta.client) return
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
    const prefersDark =
      window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
    apply(saved ?? (prefersDark ? 'dark' : 'light'))
  }

  return {
    theme,
    isDark: computed(() => theme.value === 'dark'),
    toggle,
    init,
  }
}
