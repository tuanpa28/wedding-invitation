import type { Metadata } from 'next'
import { Suspense } from 'react'
import { InvitationLoading, InvitationView } from '@/components/invitation/invitation-view'
import { invitationMetadata } from '@/lib/invitation/metadata'

export async function generateMetadata({
  params,
}: PageProps<'/[slug]/[guestCode]'>): Promise<Metadata> {
  const { slug, guestCode } = await params
  return invitationMetadata(slug, guestCode)
}

export default function GuestInvitationPage({
  params,
  searchParams,
}: PageProps<'/[slug]/[guestCode]'>) {
  return (
    <Suspense fallback={<InvitationLoading />}>
      <InvitationView params={params} searchParams={searchParams} />
    </Suspense>
  )
}
