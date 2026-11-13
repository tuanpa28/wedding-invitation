import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { LoginPanel } from '@/components/auth/login-panel'
import { Wordmark } from '@/components/dashboard/wordmark'
import { Toaster } from '@/components/ui/sonner'
import { safeNext } from '@/lib/auth-client'
import { isDevLoginEnabled, isGoogleConfigured } from '@/server/auth-config'
import { getSessionUser } from '@/server/session'

export const metadata: Metadata = {
  title: 'Đăng nhập — Thiệp Hồng',
  robots: { index: false },
}

export default function LoginPage({ searchParams }: PageProps<'/login'>) {
  return (
    <main className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <Wordmark href="/" />
        <div className="max-w-md">
          <p className="font-display text-5xl leading-[1.05] tracking-tight italic">
            Một tấm thiệp,
            <br />
            gửi đúng tên từng người.
          </p>
          <p className="mt-6 text-base/relaxed text-primary-foreground/80">
            Nhập thông tin lễ cưới của hai bên gia đình, xem thiệp ngay trên điện thoại, rồi gửi
            link cho khách qua Zalo.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/70">Miễn phí, không quảng cáo.</p>
        <span
          aria-hidden
          className="pointer-events-none absolute -right-24 -bottom-28 font-display text-[22rem] leading-none text-white/[0.06] select-none"
        >
          囍
        </span>
      </section>

      <section className="flex flex-col items-center justify-center gap-8 px-4 py-12">
        <div className="lg:hidden">
          <Wordmark href="/" />
        </div>
        <Suspense fallback={<div className="h-64 w-full max-w-sm" />}>
          <LoginContent searchParams={searchParams} />
        </Suspense>
      </section>
      <Toaster position="top-center" />
    </main>
  )
}

async function LoginContent({ searchParams }: Pick<PageProps<'/login'>, 'searchParams'>) {
  const { next } = await searchParams
  const target = safeNext(typeof next === 'string' ? next : undefined)
  if (await getSessionUser()) redirect(target)

  return <LoginPanel next={target} google={isGoogleConfigured()} devLogin={isDevLoginEnabled()} />
}
