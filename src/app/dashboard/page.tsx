import { ArrowUpRight, Plus } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { AppHeader } from '@/components/dashboard/app-header'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { Button } from '@/components/ui/button'
import { LIMITS } from '@/lib/invitation/defaults'
import { requirePageUser } from '@/server/session'
import { listMyWeddings } from '@/server/services/weddings'
import { TEMPLATE_CATALOG } from '@/templates/catalog'

export default function DashboardPage() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10">
        <Suspense fallback={<ListSkeleton />}>
          <WeddingList />
        </Suspense>
      </main>
    </>
  )
}

const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Ho_Chi_Minh',
})

async function WeddingList() {
  const user = await requirePageUser('/dashboard')
  const weddings = await listMyWeddings(user.id)
  const ownedCount = weddings.filter((w) => w.role === 'owner').length
  const canCreate = ownedCount < LIMITS.weddingsPerUser

  if (weddings.length === 0) {
    return (
      <section className="mx-auto max-w-lg py-16 text-center">
        <p aria-hidden className="font-display text-7xl text-primary/80">
          囍
        </p>
        <h1 className="mt-6 font-display text-4xl tracking-tight">Chào {user.name}</h1>
        <p className="mt-3 text-muted-foreground">
          Bắt đầu bằng tên hai bạn và một đường dẫn. Sự kiện, ảnh và nhạc có thể thêm sau.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/dashboard/new">
            <Plus /> Tạo thiệp cưới
          </Link>
        </Button>
      </section>
    )
  }

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-tight">Thiệp của bạn</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {weddings.length} thiệp · tạo được tối đa {LIMITS.weddingsPerUser} thiệp
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/dashboard/new">
              <Plus /> Tạo thiệp mới
            </Link>
          </Button>
        )}
      </div>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {weddings.map((w) => {
          const [bg, , accent] = TEMPLATE_CATALOG[w.templateId].swatch
          return (
            <li key={w.id}>
              <Link
                href={`/dashboard/${w.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition outline-none hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                {/* Dải màu theo mẫu thiệp, như mép phong bì */}
                <span aria-hidden className="flex h-2">
                  <span className="flex-1" style={{ background: bg }} />
                  <span className="w-10" style={{ background: accent }} />
                </span>
                <span className="flex flex-1 flex-col gap-3 p-5">
                  <span className="flex items-start justify-between gap-3">
                    <span className="font-display text-2xl leading-tight tracking-tight">
                      {w.groomName}
                      <span className="mx-1.5 text-primary italic">&amp;</span>
                      {w.brideName}
                    </span>
                    <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {w.firstEventAt
                      ? dateFormat.format(new Date(w.firstEventAt))
                      : 'Chưa có sự kiện'}
                  </span>
                  <span className="mt-auto flex items-center justify-between gap-2 pt-2 text-xs">
                    <span className="truncate font-mono text-muted-foreground">/{w.slug}</span>
                    <StatusBadge status={w.status} />
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function ListSkeleton() {
  return (
    <div aria-busy="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1].map((i) => (
        <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  )
}
