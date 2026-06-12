// Domain types shared across services, stores, composables, and components.
// Mirror the API contract in documentation/API-Contract.md.

export type UserRole = 'admin' | 'staff'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Category {
  id: string
  name: string
  createdAt?: string
  updatedAt?: string
}

export interface Product {
  id: string
  categoryId: string
  categoryName?: string
  sku: string
  name: string
  description: string | null
  weight: number | null
  width: number | null
  length: number | null
  height: number | null
  image: string | null
  price: number
  isActive: boolean
  stock: number
  // Archived = soft-deleted. `isActive` is the inverse of `archived`.
  archived?: boolean
  deletedAt?: string | null
  createdAt?: string
  updatedAt?: string
}

// Payload for create — required + optional fields per API contract.
export interface ProductCreateInput {
  categoryId: string
  sku: string
  name: string
  description?: string | null
  weight?: number | null
  width?: number | null
  length?: number | null
  height?: number | null
  image?: string | null
  price: number
  stock: number
}

// Edit is a partial update.
export type ProductUpdateInput = Partial<ProductCreateInput> & { isActive?: boolean }

export type ProductSortBy = 'name' | 'price' | 'stock' | 'createdAt'
export type SortOrder = 'asc' | 'desc'

export interface ProductListQuery {
  page?: number
  limit?: number
  search?: string
  categoryId?: string | null
  isActive?: boolean | null
  sortBy?: ProductSortBy
  sortOrder?: SortOrder
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

// Response envelopes — see API-Contract.md "Response Envelope".
export interface ApiItemResponse<T> {
  data: T
}

export interface ApiListResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export interface ApiErrorDetail {
  field: string
  message: string
}

export interface ApiErrorBody {
  error: {
    code: number
    message: string
    details?: ApiErrorDetail[]
  }
}

// Normalized error thrown by the api client so the UI has one shape to handle.
export interface NormalizedApiError {
  status: number
  message: string
  details?: ApiErrorDetail[]
}

export interface ApiLog {
  id: string
  method: string
  path: string
  statusCode: number
  duration: number
  ip: string | null
  userAgent: string | null
  userId: string | null
  requestBody: Record<string, unknown> | null
  createdAt: string
}

export interface ApiLogQuery {
  page?: number
  limit?: number
  path?: string
  statusCode?: number | null
  userId?: string
  startDate?: string
  endDate?: string
}

export interface Credentials {
  email: string
  password: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
  confirmPassword: string
}
