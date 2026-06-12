// Restore the session once on app startup (SPA): hit /auth/me so the store is
// populated before route middleware runs. Runs on the client only.
export default defineNuxtPlugin(async () => {
  const auth = useAuthStore()
  if (!auth.initialized) {
    await auth.fetchCurrentUser()
  }
})
