import type { Metadata } from 'next'
import { InvitationApp } from '@/components/invitation/invitation-app'
import { loadWeddingSnapshot, shareMetadata } from '@/lib/firebase/snapshot'

export async function generateMetadata(): Promise<Metadata> {
  return shareMetadata(await loadWeddingSnapshot()) ?? {}
}

/** Link chung của thiệp: hiện sự kiện của cả hai bên. Nội dung được dựng sẵn lúc build. */
export default async function HomePage() {
  return <InvitationApp mode="general" snapshot={await loadWeddingSnapshot()} />
}
