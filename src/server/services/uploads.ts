import 'server-only'
import { createHash } from 'node:crypto'
import { HttpError } from '@/server/http'
import { requireWeddingAccess } from '@/server/permissions'

export type UploadKind = 'image' | 'audio'

interface CloudinaryConfig {
  cloudName: string
  apiKey: string
  apiSecret: string
}

export function getCloudinaryConfig(): CloudinaryConfig | null {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) return null
  return {
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    apiSecret: CLOUDINARY_API_SECRET,
  }
}

/**
 * Chữ ký upload của Cloudinary: sắp xếp tham số theo tên, nối "k=v&k=v", thêm api_secret, SHA-1.
 * https://cloudinary.com/documentation/authentication_signatures
 */
export function signCloudinaryParams(params: Record<string, string | number>, apiSecret: string) {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&')
  return createHash('sha1')
    .update(payload + apiSecret)
    .digest('hex')
}

/** Tham số ký sẵn theo loại file. Các tham số này nằm trong chữ ký → trình duyệt không sửa được. */
function paramsFor(
  kind: UploadKind,
  weddingId: string,
  timestamp: number,
): Record<string, string | number> {
  const folder = `thiephong/${weddingId}`
  return kind === 'image'
    ? {
        folder,
        timestamp,
        allowed_formats: 'jpg,jpeg,png,webp,heic,avif',
        // Thu nhỏ ảnh quá lớn ngay khi upload để tiết kiệm dung lượng free tier
        transformation: 'c_limit,w_2400,h_2400',
      }
    : { folder, timestamp, allowed_formats: 'mp3,m4a,aac,ogg,wav' }
}

/**
 * Ký một lần upload thẳng từ trình duyệt lên Cloudinary (file không đi qua server của mình).
 * Chữ ký chỉ hợp lệ khoảng 1 giờ và chỉ cho thư mục của thiệp này.
 */
export async function signUpload(userId: string, weddingId: string, kind: UploadKind) {
  await requireWeddingAccess(userId, weddingId)
  const config = getCloudinaryConfig()
  if (!config) {
    throw new HttpError(
      503,
      'uploads_disabled',
      'Chưa cấu hình Cloudinary nên chưa tải file lên được (xem README)',
    )
  }

  const params = paramsFor(kind, weddingId, Math.floor(Date.now() / 1000))
  const resourceType = kind === 'image' ? 'image' : 'video' // Cloudinary xếp âm thanh vào "video"
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/upload`,
    fields: {
      ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
      api_key: config.apiKey,
      signature: signCloudinaryParams(params, config.apiSecret),
    },
  }
}
