import Link from 'next/link'
import { SystemStatus } from '@/components/system-status'
import { demoGuests } from '@/mocks/invitations'
import { TEMPLATES } from '@/templates'

export default function Home() {
  const templates = Object.values(TEMPLATES)

  return (
    <main className="flex min-h-svh flex-col items-center gap-10 bg-rose-50 px-6 py-16 text-center">
      <div>
        <h1 className="text-4xl font-semibold text-rose-700">Thiệp Hồng</h1>
        <p className="mt-2 text-muted-foreground">Nền tảng thiệp cưới online — đang xây dựng</p>
      </div>

      <section className="w-full max-w-xl text-left">
        <h2 className="mb-3 font-medium">Xem thử thiệp mẫu</h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {templates.map((t) => (
            <li key={t.id} className="rounded-xl border bg-white p-4 text-sm shadow-sm">
              <p className="font-medium">{t.name}</p>
              <p className="mt-1 text-muted-foreground">{t.description}</p>
              <div className="mt-3 flex flex-col gap-1">
                <Link
                  className="text-rose-700 underline underline-offset-4"
                  href={`/demo?t=${t.id}`}
                >
                  Link chung
                </Link>
                {demoGuests.map((g) => (
                  <Link
                    key={g.code}
                    className="text-rose-700 underline underline-offset-4"
                    href={`/demo/${g.code}?t=${t.id}`}
                  >
                    {g.displayName} ({g.side === 'bride' ? 'nhà gái' : 'nhà trai'})
                  </Link>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <SystemStatus />
    </main>
  )
}
