import { notFound } from 'next/navigation'
import { isTemplateId } from '@/lib/invitation/helpers'
import { getMockGuest, getMockInvitation } from '@/mocks/invitations'
import { TEMPLATES } from '@/templates'
import { buildTemplateProps } from '@/templates/types'

type Params = Promise<{ slug: string; guestCode?: string }>
type SearchParams = Promise<Record<string, string | string[] | undefined>>

/** Tải dữ liệu thiệp (Phase 1: dữ liệu mẫu) và render đúng template */
export async function InvitationView({
  params,
  searchParams,
}: {
  params: Params
  searchParams: SearchParams
}) {
  const { slug, guestCode } = await params
  const invitation = getMockInvitation(slug)
  if (!invitation) notFound()

  const guest = guestCode ? getMockGuest(slug, guestCode) : undefined
  if (guestCode && !guest) notFound()

  // ?t=thanh-lich để xem thử template khác
  const { t } = await searchParams
  const templateId = isTemplateId(t) ? t : invitation.templateId
  const { Component } = TEMPLATES[templateId]

  return <Component {...buildTemplateProps(invitation, guest)} />
}

export function InvitationLoading() {
  return (
    <div className="grid min-h-svh place-items-center bg-neutral-50" aria-busy="true">
      <p className="animate-pulse text-sm text-neutral-500">Đang mở thiệp…</p>
    </div>
  )
}
