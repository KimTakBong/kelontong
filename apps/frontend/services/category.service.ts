import { getApiClient } from './api'
import type { ApiItemResponse, ApiListResponse, Category } from '~/types'

export const categoryService = {
  async list(): Promise<Category[]> {
    const { data } = await getApiClient().get<ApiListResponse<Category>>('/categories')
    return data.data
  },

  async create(name: string): Promise<Category> {
    const { data } = await getApiClient().post<ApiItemResponse<Category>>(
      '/categories',
      { name },
    )
    return data.data
  },

  async update(id: string, name: string): Promise<Category> {
    const { data } = await getApiClient().patch<ApiItemResponse<Category>>(
      `/categories/${id}`,
      { name },
    )
    return data.data
  },

  async remove(id: string): Promise<void> {
    await getApiClient().delete(`/categories/${id}`)
  },
}
