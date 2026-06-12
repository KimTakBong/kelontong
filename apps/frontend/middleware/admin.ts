import { useAuthStore } from '~/stores/auth'

// Admin-only routes (e.g. user management). Assumes `auth` middleware already
// ran to guarantee a session; here we only check the role.
export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuthStore()

  if (!auth.initialized) {
    await auth.fetchCurrentUser()
  }

  if (!auth.isAuthenticated) {
    return navigateTo('/auth/login')
  }

  if (!auth.isAdmin) {
    // Authenticated but lacks privilege — send back to the product list.
    return navigateTo('/products')
  }
})
