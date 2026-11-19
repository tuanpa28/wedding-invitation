import { UploadError } from '@/lib/cloudinary'
import type { WeddingDoc } from '@/lib/invitation/types'

export type WeddingPatch = Partial<Record<keyof WeddingDoc, unknown>>

/** Props chung của các form trong trang quản lý */
export interface EditorFormProps {
  wedding: WeddingDoc
  /** Ghi vào Firestore; lỗi được ném ra để form hiện thông báo */
  onSave: (patch: WeddingPatch) => Promise<void>
}

/** Thông báo lỗi dễ hiểu cho người dùng */
export function errorMessage(error: unknown, fallback = 'Không lưu được, thử lại sau') {
  if (error instanceof UploadError) return error.message
  const code = (error as { code?: string } | null)?.code
  if (code === 'permission-denied') return 'Tài khoản này không có quyền sửa thiệp'
  if (code === 'unavailable') return 'Mất kết nối mạng, thử lại sau'
  return fallback
}
