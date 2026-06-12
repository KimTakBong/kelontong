import { getApiClient } from './api'
import type {
  ApiItemResponse,
  Credentials,
  RegisterInput,
  User,
} from '~/types'

// All auth HTTP calls live here. Maps 1:1 to /auth endpoints in the API contract.
export const authService = {
  async login(credentials: Credentials): Promise<User> {
    const { data } = await getApiClient().post<ApiItemResponse<User>>(
      '/auth/login',
      credentials,
    )
    return data.data
  },

  async register(input: RegisterInput): Promise<User> {
    const { data } = await getApiClient().post<ApiItemResponse<User>>(
      '/auth/register',
      input,
    )
    return data.data
  },

  async logout(): Promise<void> {
    await getApiClient().post('/auth/logout')
  },

  async me(): Promise<User> {
    const { data } = await getApiClient().get<ApiItemResponse<User>>('/auth/me')
    return data.data
  },
}
