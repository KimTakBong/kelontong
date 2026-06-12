import { defineStore } from 'pinia'
import { authService } from '~/services/auth.service'
import type { Credentials, RegisterInput, User } from '~/types'

// Session user lives in a store because it's shared app-wide: layout header,
// route middleware, and role-conditional UI all read from it.
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    // Tracks whether we've attempted to restore the session at least once,
    // so middleware doesn't redirect before the first /auth/me resolves.
    initialized: false,
  }),

  getters: {
    isAuthenticated: (state): boolean => state.user !== null,
    isAdmin: (state): boolean => state.user?.role === 'admin',
    isStaff: (state): boolean => state.user?.role === 'staff',
  },

  actions: {
    async login(credentials: Credentials): Promise<void> {
      this.user = await authService.login(credentials)
      this.initialized = true
    },

    async register(input: RegisterInput): Promise<User> {
      // Register does not log the user in (default role: staff) — page redirects
      // to login afterwards.
      return authService.register(input)
    },

    async logout(): Promise<void> {
      try {
        await authService.logout()
      } finally {
        this.clear()
      }
    },

    // Restore the session from the cookie on app load / page refresh.
    async fetchCurrentUser(): Promise<void> {
      try {
        this.user = await authService.me()
      } catch {
        this.user = null
      } finally {
        this.initialized = true
      }
    },

    clear(): void {
      this.user = null
    },
  },
})
