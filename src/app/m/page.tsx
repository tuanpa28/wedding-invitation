import type { Metadata } from 'next'
import { InvitationApp } from '@/components/invitation/invitation-app'
import { loadWeddingSnapshot, shareMetadata } from '@/lib/firebase/snapshot'

export async function generateMetadata(): Promise<Metadata> {
  const meta = shareMetadata(await loadWeddingSnapshot())
  return {
    ...meta,
    title: meta ? `Thiệp mời — ${meta.title}` : undefined,
    robots: { index: false },
  }
}

/**
 * Thiệp riêng của khách: /m/<mã-khách>.
 * Firebase Hosting rewrite /m/** → /m.html (firebase.json); mã khách đọc từ URL ở trình duyệt.
 * Ảnh preview khi share là ảnh chung của thiệp (site tĩnh không tạo được ảnh theo tên từng khách).
 */
export default async function GuestInvitationPage() {
  return <InvitationApp mode="guest" snapshot={await loadWeddingSnapshot()} />
}
