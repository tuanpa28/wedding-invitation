import { LIMITS } from '@/lib/invitation/defaults'

/** Lỗi từ API (đã có message tiếng Việt để hiện cho người dùng) */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

/** Gọi API của app: gửi/nhận JSON, lỗi → ApiError */
export async function api<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(path, {
    method: options.method ?? (options.body === undefined ? 'GET' : 'POST'),
    headers: options.body === undefined ? undefined : { 'content-type': 'application/json' },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
  if (response.status === 204) return undefined as T

  const data = (await response.json().catch(() => ({}))) as {
    error?: string
    message?: string
  }
  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.error ?? 'unknown',
      data.message ?? 'Có lỗi xảy ra, vui lòng thử lại',
    )
  }
  return data as T
}

export interface UploadedFile {
  url: string
  publicId: string
  width?: number
  height?: number
}

/** Ký ở server rồi tải file thẳng từ trình duyệt lên Cloudinary */
export async function uploadFile(
  weddingId: string,
  kind: 'image' | 'audio',
  file: File,
): Promise<UploadedFile> {
  const max = kind === 'image' ? LIMITS.imageBytes : LIMITS.musicBytes
  if (file.size > max) {
    throw new ApiError(413, 'too_large', `File quá lớn (tối đa ${max / 1024 / 1024} MB)`)
  }

  const { uploadUrl, fields } = await api<{ uploadUrl: string; fields: Record<string, string> }>(
    '/api/uploads/sign',
    { body: { weddingId, kind } },
  )
  const form = new FormData()
  for (const [key, value] of Object.entries(fields)) form.append(key, value)
  form.append('file', file)

  const response = await fetch(uploadUrl, { method: 'POST', body: form })
  const data = (await response.json().catch(() => ({}))) as {
    secure_url?: string
    public_id?: string
    width?: number
    height?: number
    error?: { message?: string }
  }
  if (!response.ok || !data.secure_url || !data.public_id) {
    throw new ApiError(
      response.status,
      'upload_failed',
      data.error?.message ? `Tải lên thất bại: ${data.error.message}` : 'Tải lên thất bại',
    )
  }
  return { url: data.secure_url, publicId: data.public_id, width: data.width, height: data.height }
}
