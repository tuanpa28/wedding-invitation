import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { AcceptInviteButton } from '@/components/dashboard/accept-invite-button'
import { Wordmark } from '@/components/dashboard/wordmark'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { getSessionUser } from '@/server/session'
import { getInvitePreview } from '@/server/services/members'

export const metadata: Metadata = {
  title: 'Lời mời cùng quản lý thiệp — Thiệp Hồng',
  robots: { index: false },
}

export default function InvitePage({ params }: PageProps<'/invite/[token]'>) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-10 px-4 py-12">
      <Wordmark href="/" />
      <Suspense
        fallback={<div className="h-56 w-full max-w-md animate-pulse rounded-2xl bg-muted" />}
      >
        <InviteCard params={params} />
      </Suspense>
      <Toaster position="top-center" />
    </main>
  )
}

async function InviteCard({ params }: Pick<PageProps<'/invite/[token]'>, 'params'>) {
  const { token } = await params
  const [preview, user] = await Promise.all([getInvitePreview(token), getSessionUser()])

  if (preview.state !== 'ok') {
    const message = {
      invalid: 'Link mời không đúng. Hãy kiểm tra lại link bạn nhận được.',
      expired: 'Link mời đã hết hạn. Hãy nhờ người gửi tạo link mới.',
      used: 'Link mời này đã được dùng.',
    }[preview.state]
    return (
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center">
        <p className="text-muted-foreground">{message}</p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/dashboard">Về trang quản lý</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
      <p className="text-sm text-muted-foreground">Bạn được mời cùng quản lý thiệp cưới</p>
      <p className="mt-3 font-display text-4xl tracking-tight">
        {preview.groomName}
        <span className="mx-2 text-primary italic">&amp;</span>
        {preview.brideName}
      </p>
      <div className="mt-8">
        {user ? (
          <AcceptInviteButton token={token} />
        ) : (
          <Button asChild size="lg">
            <Link href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}>
              Đăng nhập để nhận lời mời
            </Link>
          </Button>
        )}
      </div>
      {user && <p className="mt-4 text-xs text-muted-foreground">Đang đăng nhập: {user.email}</p>}
    </div>
  )
}
