import Link from 'next/link'
import { SystemStatus } from '@/components/system-status'
import { seedWeddings } from '@/mocks/invitations'
import { TEMPLATES } from '@/templates'

// Trang chủ tạm (tới Phase 7 làm landing): link vào dashboard và các thiệp mẫu đã seed
export default function Home() {
  const templates = Object.values(TEMPLATES)

  return (
    <main className="flex min-h-svh flex-col items-center gap-10 bg-rose-50 px-6 py-16 text-center">
      <div>
        <h1 className="text-4xl font-semibold text-rose-700">Thiệp Hồng</h1>
        <p className="mt-2 text-muted-foreground">Nền tảng thiệp cưới online — đang xây dựng</p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/85"
        >
          Tạo / quản lý thiệp của bạn
        </Link>
      </div>

      <section className="w-full max-w-xl text-left">
        <h2 className="mb-3 font-medium">Thiệp mẫu trong database</h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {seedWeddings.map(({ invitation, status, guests }) => {
            const base = `/${invitation.slug}`
            return (
              <li
                key={invitation.slug}
                className="rounded-xl border bg-white p-4 text-sm shadow-sm"
              >
                <p className="font-medium">
                  {invitation.groom.shortName} &amp; {invitation.bride.shortName}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {TEMPLATES[invitation.templateId].name} ·{' '}
                  {status === 'published' ? 'đã publish' : 'bản nháp (phải báo không tìm thấy)'}
                </p>
                <div className="mt-3 flex flex-col gap-1">
                  <Link className="text-rose-700 underline underline-offset-4" href={base}>
                    {base}
                  </Link>
                  {guests.map((g) => (
                    <Link
                      key={g.code}
                      className="text-rose-700 underline underline-offset-4"
                      href={`${base}/${g.code}`}
                    >
                      {g.displayName} ({g.side === 'bride' ? 'nhà gái' : 'nhà trai'})
                    </Link>
                  ))}
                </div>
              </li>
            )
          })}
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">
          Thêm{' '}
          {templates.map((t, i) => (
            <span key={t.id}>
              {i > 0 && ', '}
              <code>?t={t.id}</code>
            </span>
          ))}{' '}
          vào cuối link để xem thử template khác.
        </p>
      </section>

      <SystemStatus />
    </main>
  )
}
