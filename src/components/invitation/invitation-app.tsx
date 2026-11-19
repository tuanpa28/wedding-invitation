'use client'

import { useEffect, useState } from 'react'
import {
  fetchGuest,
  fetchInvitation,
  recordGuestOpen,
  type GuestWithOpenState,
} from '@/lib/firebase/public-data'
import { eventsForSide, isTemplateId } from '@/lib/invitation/helpers'
import type { Invitation } from '@/lib/invitation/types'
import { guestCodeFromPath } from '@/lib/invitation/validation'
import { TEMPLATES } from '@/templates'
import { buildTemplateProps } from '@/templates/types'

type State =
  | { status: 'loading' }
  | { status: 'missing'; reason: 'no-wedding' | 'no-guest' | 'error' }
  | { status: 'ready'; invitation: Invitation; guest: GuestWithOpenState | null }

/**
 * Trang thiệp chạy hoàn toàn ở trình duyệt (site tĩnh trên Firebase Hosting):
 * đọc nội dung từ Firestore rồi render template đang chọn.
 * - `general`: link chung, hiện sự kiện cả hai bên
 * - `guest`: link /m/<mã>, có tên khách và chỉ hiện sự kiện bên khách
 */
export function InvitationApp({ mode }: { mode: 'general' | 'guest' }) {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [templateOverride, setTemplateOverride] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const url = new URL(window.location.href)
    // ?t=hoa-co để xem thử template khác; ?k=<mã> thay cho /m/<mã> khi chạy next dev
    const code =
      mode === 'guest' ? (guestCodeFromPath(url.pathname) ?? url.searchParams.get('k')) : null

    Promise.all([fetchInvitation(), code ? fetchGuest(code) : null])
      .then(([invitation, guest]) => {
        if (!active) return
        setTemplateOverride(url.searchParams.get('t'))
        if (!invitation) return setState({ status: 'missing', reason: 'no-wedding' })
        if (mode === 'guest' && !guest) return setState({ status: 'missing', reason: 'no-guest' })
        setState({ status: 'ready', invitation, guest })
        const couple = `${invitation.groom.shortName} & ${invitation.bride.shortName}`
        document.title = guest
          ? `Kính mời ${guest.displayName} — Lễ cưới ${couple}`
          : `Lễ cưới ${couple}`
        if (guest && !url.searchParams.has('preview')) void recordGuestOpen(guest)
      })
      .catch(() => active && setState({ status: 'missing', reason: 'error' }))

    return () => {
      active = false
    }
  }, [mode])

  if (state.status === 'loading') return <InvitationLoading />
  if (state.status === 'missing') return <InvitationMissing reason={state.reason} />

  const { invitation, guest } = state
  const templateId = isTemplateId(templateOverride) ? templateOverride : invitation.templateId
  if (eventsForSide(invitation.events, guest?.side).length === 0) {
    return <InvitationMissing reason="no-wedding" />
  }
  const { Component } = TEMPLATES[templateId]
  return <Component {...buildTemplateProps(invitation, guest ?? undefined)} />
}

export function InvitationLoading() {
  return (
    <div className="grid min-h-svh place-items-center bg-neutral-50" aria-busy="true">
      <p className="animate-pulse text-sm text-neutral-500">Đang mở thiệp…</p>
    </div>
  )
}

const MISSING_TEXT = {
  'no-wedding': {
    title: 'Thiệp đang được chuẩn bị',
    body: 'Cô dâu chú rể chưa hoàn tất thiệp. Bạn quay lại sau nhé.',
  },
  'no-guest': {
    title: 'Không tìm thấy thiệp',
    body: 'Link thiệp có thể bị gõ sai. Bạn kiểm tra lại link trong tin nhắn mời nhé.',
  },
  error: {
    title: 'Chưa mở được thiệp',
    body: 'Kết nối mạng có vấn đề. Bạn tải lại trang thử nhé.',
  },
} as const

function InvitationMissing({ reason }: { reason: keyof typeof MISSING_TEXT }) {
  const { title, body } = MISSING_TEXT[reason]
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-rose-50 px-6 text-center">
      <p className="text-sm tracking-[0.3em] text-rose-700/70 uppercase">Thiệp Hồng</p>
      <h1 className="text-2xl font-semibold text-rose-800">{title}</h1>
      <p className="max-w-sm text-muted-foreground">{body}</p>
    </main>
  )
}
