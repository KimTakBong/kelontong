import { getApiClient } from './api'
import type {
  ApiItemResponse,
  ApiListResponse,
  Product,
  ProductCreateInput,
  ProductListQuery,
  ProductUpdateInput,
} from '~/types'

// Strip null/undefined/empty query params so the URL stays clean and the
// backend receives only the filters that are actually set.
function buildParams(query: ProductListQuery): Record<string, string | number> {
  const params: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === '') continue
    params[key] = value as string | number
  }
  return params
}

export const productService = {
  async list(query: ProductListQuery = {}): Promise<ApiListResponse<Product>> {
    const { data } = await getApiClient().get<ApiListResponse<Product>>('/products', {
      params: buildParams(query),
    })
    return data
  },

  async getById(id: string): Promise<Product> {
    const { data } = await getApiClient().get<ApiItemResponse<Product>>(
      `/products/${id}`,
    )
    return data.data
  },

  async create(input: ProductCreateInput): Promise<Product> {
    const { data } = await getApiClient().post<ApiItemResponse<Product>>(
      '/products',
      input,
    )
    return data.data
  },

  async update(id: string, input: ProductUpdateInput): Promise<Product> {
    const { data } = await getApiClient().patch<ApiItemResponse<Product>>(
      `/products/${id}`,
      input,
    )
    return data.data
  },

  // Soft delete / archive. Admin only on the backend.
  async archive(id: string): Promise<void> {
    await getApiClient().delete(`/products/${id}`)
  },

  // Restore an archived product. Admin only on the backend.
  async restore(id: string): Promise<Product> {
    const { data } = await getApiClient().patch<ApiItemResponse<Product>>(
      `/products/${id}/restore`,
    )
    return data.data
  },

  // Permanent delete. Admin only, product must already be archived.
  async remove(id: string): Promise<void> {
    await getApiClient().delete(`/products/${id}/permanent`)
  },
}
