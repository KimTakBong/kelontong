import { useAuthStore } from '~/stores/auth'

// Guards protected routes: redirect to login if there is no active session.
// Runs before render so unauthenticated users never see protected content.
export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()

  // Ensure we've attempted session restore before deciding (e.g. hard refresh
  // directly onto a protected URL, before the startup plugin resolved).
  if (!auth.initialized) {
    await auth.fetchCurrentUser()
  }

  if (!auth.isAuthenticated) {
    return navigateTo({ path: '/auth/login', query: { redirect: to.fullPath } })
  }
})
