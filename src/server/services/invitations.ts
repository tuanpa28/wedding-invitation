import 'server-only'
import { cacheLife, cacheTag, revalidateTag } from 'next/cache'
import { isValidGuestCode, isValidSlug } from '@/lib/invitation/validation'
import { findGuest, findPublishedInvitation } from '@/server/repositories/invitations'

/** Tag cache của một thiệp: dùng chung cho dữ liệu thiệp và khách của thiệp đó */
export const weddingCacheTag = (slug: string) => `wedding:${slug}`

/**
 * Thiệp đã publish, có cache. Khi dữ liệu thiệp thay đổi phải gọi refreshWedding(slug).
 * Slug sai định dạng trả null ngay, không chạm DB.
 */
export async function getInvitation(slug: string) {
  'use cache'
  cacheLife('days')
  cacheTag(weddingCacheTag(slug))

  if (!isValidSlug(slug)) return null
  return findPublishedInvitation(slug)
}

export async function getGuest(slug: string, code: string) {
  'use cache'
  cacheLife('days')
  cacheTag(weddingCacheTag(slug))

  if (!isValidSlug(slug) || !isValidGuestCode(code)) return null
  return findGuest(slug, code)
}

/** Xoá cache của thiệp: request kế tiếp đọc lại từ DB (không phục vụ dữ liệu cũ) */
export function refreshWedding(slug: string) {
  revalidateTag(weddingCacheTag(slug), { expire: 0 })
}
