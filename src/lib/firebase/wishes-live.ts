// Lời chúc realtime cho trang thiệp (Firestore bản đầy đủ, tải khi khách cuộn tới sổ lưu bút)
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type Timestamp,
} from 'firebase/firestore'
import type { Side } from '@/lib/invitation/types'
import { getFullDb } from './full-db'

export interface LiveWish {
  id: string
  name: string
  message: string
  side?: Side
  /** null khi vừa gửi, chưa có giờ server */
  createdAt: Date | null
}

export const WISHES_LIMIT = 60

/** Lời chúc không bị ẩn, mới nhất trước */
export function subscribeVisibleWishes(
  onChange: (wishes: LiveWish[]) => void,
  onError: (error: unknown) => void,
) {
  const q = query(
    collection(getFullDb(), 'wishes'),
    where('hidden', '==', false),
    orderBy('createdAt', 'desc'),
    limit(WISHES_LIMIT),
  )
  return onSnapshot(
    q,
    (snap) =>
      onChange(
        snap.docs.map((d) => {
          const data = d.data({ serverTimestamps: 'estimate' }) as {
            name: string
            message: string
            side?: Side
            createdAt?: Timestamp
          }
          return {
            id: d.id,
            name: data.name,
            message: data.message,
            side: data.side,
            createdAt: data.createdAt?.toDate() ?? null,
          }
        }),
      ),
    onError,
  )
}
