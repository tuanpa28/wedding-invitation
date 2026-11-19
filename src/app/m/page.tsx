import type { Metadata } from 'next'
import { InvitationApp } from '@/components/invitation/invitation-app'

export const metadata: Metadata = {
  robots: { index: false },
}

/**
 * Thiệp riêng của khách: /m/<mã-khách>.
 * Firebase Hosting rewrite /m/** → /m.html (firebase.json); mã khách đọc từ URL ở trình duyệt.
 */
export default function GuestInvitationPage() {
  return <InvitationApp mode="guest" />
}
