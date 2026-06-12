import { getApiClient } from './api'
import type { ApiListResponse, ApiLog, ApiLogQuery } from '~/types'

// Strip empty params so only active filters hit the backend.
function buildParams(query: ApiLogQuery): Record<string, string | number> {
  const params: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === '') continue
    params[key] = value as string | number
  }
  return params
}

export const logService = {
  async list(query: ApiLogQuery = {}): Promise<ApiListResponse<ApiLog>> {
    const { data } = await getApiClient().get<ApiListResponse<ApiLog>>('/logs', {
      params: buildParams(query),
    })
    return data
  },
}
