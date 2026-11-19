import { LIMITS } from '@/lib/invitation/defaults'

// Upload thẳng từ trình duyệt lên Cloudinary bằng upload preset "unsigned"
// (site tĩnh không có server để ký). Giới hạn thư mục, định dạng, dung lượng nằm trong preset
// cấu hình ở Cloudinary Console — xem README → Cloudinary.

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

export const isCloudinaryConfigured = Boolean(CLOUD_NAME && UPLOAD_PRESET)

export interface UploadedFile {
  url: string
  publicId: string
  width?: number
  height?: number
}

export class UploadError extends Error {}

export async function uploadToCloudinary(
  file: File,
  kind: 'image' | 'audio',
): Promise<UploadedFile> {
  if (!isCloudinaryConfigured) {
    throw new UploadError('Chưa cấu hình Cloudinary (xem README)')
  }
  const max = kind === 'image' ? LIMITS.imageBytes : LIMITS.musicBytes
  if (file.size > max) {
    throw new UploadError(`File quá lớn (tối đa ${max / 1024 / 1024} MB)`)
  }

  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', UPLOAD_PRESET!)
  // Cloudinary xếp âm thanh vào loại "video"
  const resourceType = kind === 'image' ? 'image' : 'video'

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    { method: 'POST', body: form },
  )
  const data = (await response.json().catch(() => ({}))) as {
    secure_url?: string
    public_id?: string
    width?: number
    height?: number
    error?: { message?: string }
  }
  if (!response.ok || !data.secure_url || !data.public_id) {
    throw new UploadError(
      data.error?.message ? `Tải lên thất bại: ${data.error.message}` : 'Tải lên thất bại',
    )
  }
  return { url: data.secure_url, publicId: data.public_id, width: data.width, height: data.height }
}
