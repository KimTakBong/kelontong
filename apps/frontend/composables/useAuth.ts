import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth'

// Thin convenience wrapper over the auth store so pages don't all reach into
// Pinia directly. Keeps reactivity via storeToRefs.
export function useAuth() {
  const store = useAuthStore()
  const { user, isAuthenticated, isAdmin, isStaff, initialized } = storeToRefs(store)

  return {
    user,
    isAuthenticated,
    isAdmin,
    isStaff,
    initialized,
    login: store.login,
    register: store.register,
    logout: store.logout,
    fetchCurrentUser: store.fetchCurrentUser,
  }
}
