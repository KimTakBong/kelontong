import { getApiClient } from './api'
import type { ApiItemResponse } from '~/types'

export interface UploadedImage {
  url: string
  filename: string
}

export const uploadService = {
  // Uploads a single image file and returns its public URL. The backend stores
  // it locally and serves it at /uploads/<filename> (see PRD §9.4).
  async image(file: File): Promise<UploadedImage> {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await getApiClient().post<ApiItemResponse<UploadedImage>>(
      '/uploads/image',
      formData,
      // Override the client's default JSON content-type; axios fills in the
      // multipart boundary automatically for FormData payloads.
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data.data
  },
}
