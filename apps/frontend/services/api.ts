import axios, { type AxiosError, type AxiosInstance } from 'axios'
import type { ApiErrorBody, NormalizedApiError } from '~/types'

// Single axios instance used by every service. Components and composables must
// never import axios directly — always go through a service (Architecture-Note §3).
let client: AxiosInstance | null = null

export function getApiClient(): AxiosInstance {
  if (client) return client

  const config = useRuntimeConfig()

  client = axios.create({
    baseURL: config.public.apiBaseUrl,
    // Session-based auth: the connect.sid cookie must ride along with requests.
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  })

  // Normalize every backend error into a single predictable shape so the UI
  // never has to dig through axios internals.
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiErrorBody>) => {
      const normalized = normalizeError(error)

      // A 401 anywhere means the session is gone — clear local auth state and
      // bounce to login (skipped during SSR / when already on an auth page).
      if (normalized.status === 401 && import.meta.client) {
        const route = useRoute()
        if (!route.path.startsWith('/auth')) {
          const auth = useAuthStore()
          auth.clear()
          navigateTo('/auth/login')
        }
      }

      return Promise.reject(normalized)
    },
  )

  return client
}

function normalizeError(error: AxiosError<ApiErrorBody>): NormalizedApiError {
  const status = error.response?.status ?? 0
  const body = error.response?.data

  if (body?.error) {
    return {
      status,
      message: body.error.message,
      details: body.error.details,
    }
  }

  if (error.code === 'ERR_NETWORK') {
    return { status: 0, message: 'Tidak dapat terhubung ke server. Coba lagi.' }
  }

  return { status, message: error.message || 'Terjadi kesalahan tak terduga.' }
}

// Type guard so call sites can narrow a caught unknown into our error shape.
export function isApiError(err: unknown): err is NormalizedApiError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    'message' in err
  )
}
