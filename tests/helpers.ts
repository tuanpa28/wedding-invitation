import { randomUUID } from 'node:crypto'
import { getDb } from '@/server/db'
import { user } from '@/server/db/schema'

/** Tạo user thẳng trong DB test (bỏ qua Better Auth) */
export async function createUser(name = 'Người thử') {
  const id = randomUUID()
  await getDb()
    .insert(user)
    .values({ id, name, email: `${id}@thiephong.test` })
  return { id, name }
}

/** Slug ngẫu nhiên hợp lệ để test không đụng nhau */
export const randomSlug = (prefix = 't') => `${prefix}-${randomUUID().slice(0, 8)}`

/** Bắt lỗi của promise để kiểm tra mã HTTP */
export async function errorOf(promise: Promise<unknown>) {
  try {
    await promise
  } catch (error) {
    return error as { status?: number; code?: string }
  }
  throw new Error('Mong đợi lỗi nhưng promise thành công')
}

export const sampleEvent = {
  side: 'bride' as const,
  type: 'vu_quy' as const,
  title: 'Lễ Vu Quy',
  startAt: '2027-04-18T09:00:00+07:00',
  venue: 'Tư gia nhà gái',
  address: '12 Lê Lợi, Huế',
  mapUrl: undefined,
  lunarText: undefined,
}
