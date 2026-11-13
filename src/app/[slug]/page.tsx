import type { Metadata } from 'next'
import { Suspense } from 'react'
import { InvitationLoading, InvitationView } from '@/components/invitation/invitation-view'
import { invitationMetadata } from '@/components/invitation/invitation-metadata'

export async function generateMetadata({ params }: PageProps<'/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  return invitationMetadata(slug)
}

export default function InvitationPage({ params, searchParams }: PageProps<'/[slug]'>) {
  return (
    <Suspense fallback={<InvitationLoading />}>
      <InvitationView params={params} searchParams={searchParams} />
    </Suspense>
  )
}
