import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { InvitationLoading } from '@/components/invitation/invitation-view'
import { eventsForSide } from '@/lib/invitation/helpers'
import type { Side } from '@/lib/invitation/types'
import { HttpError } from '@/server/http'
import { requireWeddingAccess } from '@/server/permissions'
import { findInvitationById } from '@/server/repositories/invitations'
import { requirePageUser } from '@/server/session'
import { TEMPLATES } from '@/templates'
import { buildTemplateProps } from '@/templates/types'

/** Xem trước thiệp ở mọi trạng thái (kể cả nháp) — chỉ người quản lý thiệp */
export default function PreviewPage({
  params,
  searchParams,
}: PageProps<'/dashboard/[id]/preview'>) {
  return (
    <Suspense fallback={<InvitationLoading />}>
      <Preview params={params} searchParams={searchParams} />
    </Suspense>
  )
}

async function Preview({
  params,
  searchParams,
}: Pick<PageProps<'/dashboard/[id]/preview'>, 'params' | 'searchParams'>) {
  const { id } = await params
  const user = await requirePageUser(`/dashboard/${id}/preview`)
  await requireWeddingAccess(user.id, id).catch((error: unknown) => {
    if (error instanceof HttpError) notFound()
    throw error
  })

  // Không cache: luôn thấy bản vừa lưu
  const invitation = await findInvitationById(id)
  if (!invitation) notFound()

  const { side: rawSide } = await searchParams
  const side: Side | undefined = rawSide === 'bride' || rawSide === 'groom' ? rawSide : undefined
  const guest = side
    ? { code: 'preview', side, displayName: side === 'groom' ? 'Anh Nam' : 'Chị Hoa' }
    : undefined

  if (eventsForSide(invitation.events, side).length === 0) {
    return (
      <div className="grid min-h-svh place-items-center bg-muted p-8 text-center text-sm text-muted-foreground">
        {side
          ? `Chưa có sự kiện nào khách ${side === 'groom' ? 'nhà trai' : 'nhà gái'} thấy được.`
          : 'Thêm ít nhất một sự kiện để xem trước thiệp.'}
      </div>
    )
  }

  const { Component } = TEMPLATES[invitation.templateId]
  return <Component {...buildTemplateProps(invitation, guest)} />
}
