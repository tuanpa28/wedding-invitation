import type { Metadata } from 'next'
import { AdminApp } from '@/components/admin/admin-app'
import { Toaster } from '@/components/ui/sonner'
import { loadWeddingSnapshot } from '@/lib/firebase/snapshot'
import { prerenderStamp } from '@/lib/prerender'

export const metadata: Metadata = {
  title: 'Quản lý thiệp — Thiệp Hồng',
  robots: { index: false },
}

/**
 * Trang quản lý: chạy hoàn toàn ở trình duyệt (Firebase Auth + Firestore). Lúc build chỉ ghi lại
 * dấu vết bản thiệp dựng sẵn, để nhắc deploy lại khi đổi mẫu/ảnh bìa/tên/ngày cưới.
 */
export default async function AdminPage() {
  const snapshot = await loadWeddingSnapshot()
  return (
    <>
      <AdminApp built={snapshot ? prerenderStamp(snapshot) : null} />
      <Toaster position="top-center" />
    </>
  )
}
