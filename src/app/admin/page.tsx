import type { Metadata } from 'next'
import { AdminApp } from '@/components/admin/admin-app'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: 'Quản lý thiệp — Thiệp Hồng',
  robots: { index: false },
}

/** Trang quản lý: chạy hoàn toàn ở trình duyệt (Firebase Auth + Firestore) */
export default function AdminPage() {
  return (
    <>
      <AdminApp />
      <Toaster position="top-center" />
    </>
  )
}
