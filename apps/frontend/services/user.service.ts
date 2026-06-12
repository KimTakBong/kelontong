import { getApiClient } from './api'
import type { ApiItemResponse, ApiListResponse, User, UserRole } from '~/types'

export interface UserCreateInput {
  name: string
  email: string
  password: string
  role: UserRole
}

export interface UserUpdateInput {
  name?: string
  role?: UserRole
  isActive?: boolean
}

export const userService = {
  async list(): Promise<User[]> {
    const { data } = await getApiClient().get<ApiListResponse<User>>('/users')
    return data.data
  },

  async create(input: UserCreateInput): Promise<User> {
    const { data } = await getApiClient().post<ApiItemResponse<User>>(
      '/users',
      input,
    )
    return data.data
  },

  async update(id: string, input: UserUpdateInput): Promise<User> {
    const { data } = await getApiClient().patch<ApiItemResponse<User>>(
      `/users/${id}`,
      input,
    )
    return data.data
  },

  async remove(id: string): Promise<void> {
    await getApiClient().delete(`/users/${id}`)
  },
}
