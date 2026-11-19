import type { Photo } from './types'

/** Ảnh bìa dùng khi cặp đôi chưa tải ảnh bìa lên */
export const DEFAULT_COVER: Photo = {
  src: '/demo/cover.jpg',
  width: 960,
  height: 1440,
  alt: 'Ảnh bìa thiệp cưới',
}

/** Giới hạn mỗi thiệp (giữ trong free tier của Cloudinary/Neon) */
export const LIMITS = {
  weddingsPerUser: 3,
  membersPerWedding: 4,
  events: 12,
  photos: 40,
  musicBytes: 8 * 1024 * 1024,
  imageBytes: 10 * 1024 * 1024,
} as const
