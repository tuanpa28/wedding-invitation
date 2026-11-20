'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import {
  subscribeAllWishes,
  subscribeGuests,
  subscribeRsvps,
  type AdminGuest,
  type AdminRsvp,
  type AdminWish,
} from '@/lib/firebase/admin-client'
import { errorMessage } from './editor-types'

/** `null` = đang tải lần đầu */
export interface AdminData {
  guests: AdminGuest[] | null
  rsvps: AdminRsvp[] | null
  wishes: AdminWish[] | null
}

const AdminDataContext = createContext<AdminData>({ guests: null, rsvps: null, wishes: null })

/**
 * Mở mỗi listener Firestore đúng một lần cho cả trang quản lý. Các tab (Tổng quan, Khách mời,
 * Phản hồi) dùng chung dữ liệu, nên đổi tab không đọc lại từ đầu và không tốn thêm hạn mức.
 */
export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AdminData>({ guests: null, rsvps: null, wishes: null })

  useEffect(() => {
    let warned = false
    const onError = (key: keyof AdminData) => (error: unknown) => {
      setData((d) => ({ ...d, [key]: d[key] ?? [] }))
      if (!warned) toast.error(errorMessage(error, 'Không tải được dữ liệu, thử tải lại trang'))
      warned = true
    }
    const unsubs = [
      subscribeGuests((guests) => setData((d) => ({ ...d, guests })), onError('guests')),
      subscribeRsvps((rsvps) => setData((d) => ({ ...d, rsvps })), onError('rsvps')),
      subscribeAllWishes((wishes) => setData((d) => ({ ...d, wishes })), onError('wishes')),
    ]
    return () => unsubs.forEach((u) => u())
  }, [])

  return <AdminDataContext value={data}>{children}</AdminDataContext>
}

export const useAdminData = () => useContext(AdminDataContext)
