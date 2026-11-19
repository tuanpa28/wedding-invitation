'use client'

import { Suspense, useEffect, useState } from 'react'
import {
  fetchGuest,
  fetchInvitation,
  recordGuestOpen,
  type GuestWithOpenState,
} from '@/lib/firebase/public-data'
import { eventsForSide, isTemplateId } from '@/lib/invitation/helpers'
import type { Invitation } from '@/lib/invitation/types'
import { guestCodeFromPath } from '@/lib/invitation/validation'
import { TEMPLATE_COMPONENTS, TEMPLATE_LOADERS } from '@/templates'
import { buildTemplateProps } from '@/templates/types'

type LoadResult = [Invitation | null, GuestWithOpenState | null]

/**
 * Bắt đầu đọc Firestore ngay khi file JS này chạy trong trình duyệt (không đợi React render xong)
 * để thiệp hiện sớm hơn. Mỗi lần tải trang chỉ đọc một lần.
 */
let pending: { mode: string; promise: Promise<LoadResult> } | undefined
function loadData(mode: 'general' | 'guest'): Promise<LoadResult> {
  if (pending?.mode === mode) return pending.promise
  const url = new URL(window.location.href)
  // ?k=<mã> thay cho /m/<mã> khi chạy next dev
  const code =
    mode === 'guest' ? (guestCodeFromPath(url.pathname) ?? url.searchParams.get('k')) : null
  const promise = Promise.all([fetchInvitation(), code ? fetchGuest(code) : null])
  pending = { mode, promise }
  return promise
}
if (typeof window !== 'undefined') {
  void loadData(window.location.pathname.startsWith('/m') ? 'guest' : 'general').catch(() => {})
}

type State =
  | { status: 'loading' }
  | { status: 'missing'; reason: 'no-wedding' | 'no-guest' | 'error' }
  | { status: 'ready'; invitation: Invitation; guest: GuestWithOpenState | null }

/**
 * Trang thiệp (site tĩnh trên Firebase Hosting).
 * - `snapshot`: nội dung thiệp đọc lúc build. Link chung hiện ngay bản này (HTML dựng sẵn),
 *   rồi đọc Firestore để cập nhật nếu admin đã sửa sau lần deploy.
 * - `general`: link chung, hiện sự kiện cả hai bên
 * - `guest`: link /m/<mã>, có tên khách và chỉ hiện sự kiện bên khách (phải đợi đọc tên khách)
 */
export function InvitationApp({
  mode,
  snapshot = null,
}: {
  mode: 'general' | 'guest'
  snapshot?: Invitation | null
}) {
  const [state, setState] = useState<State>(() =>
    mode === 'general' && snapshot
      ? { status: 'ready', invitation: snapshot, guest: null }
      : { status: 'loading' },
  )
  const [templateOverride, setTemplateOverride] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const url = new URL(window.location.href)
    // "/m" không kèm mã khách → về link chung (Firebase Hosting cũng chuyển hướng /m → /)
    if (mode === 'guest' && /^\/m\/?$/.test(url.pathname) && !url.searchParams.get('k')) {
      window.location.replace(`/${url.search}`)
      return
    }
    // Link khách: tải sẵn code template trong lúc đợi đọc tên khách
    if (snapshot) void TEMPLATE_LOADERS[snapshot.templateId]?.().catch(() => {})
    // ?t=hoa-co để xem thử template khác
    loadData(mode)
      .then(([invitation, guest]) => {
        if (!active) return
        setTemplateOverride(url.searchParams.get('t'))
        if (!invitation) return setState({ status: 'missing', reason: 'no-wedding' })
        if (mode === 'guest' && !guest) return setState({ status: 'missing', reason: 'no-guest' })
        setState((current) =>
          // Giữ nguyên object cũ nếu nội dung không đổi → không render lại cả thiệp
          current.status === 'ready' &&
          !guest &&
          !url.searchParams.has('side') &&
          JSON.stringify(current.invitation) === JSON.stringify(invitation)
            ? current
            : { status: 'ready', invitation, guest: guest ?? previewGuest(url) },
        )
        const couple = `${invitation.groom.shortName} & ${invitation.bride.shortName}`
        document.title = guest
          ? `Kính mời ${guest.displayName} — Lễ cưới ${couple}`
          : `Lễ cưới ${couple}`
        if (guest && !url.searchParams.has('preview')) void recordGuestOpen(guest)
      })
      // Mất mạng mà đã có bản dựng sẵn thì cứ hiện bản đó
      .catch(
        () =>
          active &&
          setState((c) => (c.status === 'ready' ? c : { status: 'missing', reason: 'error' })),
      )

    return () => {
      active = false
    }
  }, [mode, snapshot])

  if (state.status === 'loading') return <InvitationLoading />
  if (state.status === 'missing') return <InvitationMissing reason={state.reason} />

  const { invitation, guest } = state
  // Mẫu đã bỏ (ví dụ thanh-lich cũ) → dùng mẫu mặc định thay vì lỗi
  const saved = isTemplateId(invitation.templateId) ? invitation.templateId : 'song-hy'
  const templateId = isTemplateId(templateOverride) ? templateOverride : saved
  if (eventsForSide(invitation.events, guest?.side).length === 0) {
    return <InvitationMissing reason="no-wedding" />
  }
  const Template = TEMPLATE_COMPONENTS[templateId]
  return (
    <Suspense fallback={<InvitationLoading />}>
      <Template {...buildTemplateProps(invitation, guest ?? undefined)} />
    </Suspense>
  )
}

/** Trang quản lý xem trước như khách một bên: /?preview&side=groom|bride */
function previewGuest(url: URL): GuestWithOpenState | null {
  const side = url.searchParams.get('side')
  if (!url.searchParams.has('preview') || (side !== 'groom' && side !== 'bride')) return null
  return {
    code: 'preview',
    side,
    displayName: side === 'groom' ? 'Anh Nam' : 'Chị Hoa',
    firstOpened: false,
  }
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
