import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { HealthResponse } from '../shared/health'

type Status =
  | { state: 'loading' }
  | { state: 'done'; data: HealthResponse }
  | { state: 'error'; message: string }

async function fetchHealth(): Promise<Status> {
  try {
    const res = await fetch('/api/health')
    const data = (await res.json()) as HealthResponse
    return { state: 'done', data }
  } catch {
    return { state: 'error', message: 'Không gọi được API' }
  }
}

function App() {
  const [status, setStatus] = useState<Status>({ state: 'loading' })

  useEffect(() => {
    let cancelled = false
    void fetchHealth().then((s) => {
      if (!cancelled) setStatus(s)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const recheck = async () => {
    setStatus({ state: 'loading' })
    setStatus(await fetchHealth())
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-rose-50 p-6 text-center">
      <h1 className="text-4xl font-semibold text-rose-700">Thiệp Hồng</h1>
      <p className="text-muted-foreground">Nền tảng thiệp cưới online — đang xây dựng</p>

      <section className="w-full max-w-sm rounded-xl border bg-white p-4 text-left text-sm shadow-sm">
        <h2 className="mb-2 font-medium">Trạng thái hệ thống</h2>
        {status.state === 'loading' && <p>Đang kiểm tra…</p>}
        {status.state === 'error' && <p className="text-red-600">{status.message}</p>}
        {status.state === 'done' && (
          <ul className="space-y-1" data-testid="health">
            <li>API: {status.data.ok ? '✅ hoạt động' : '❌ lỗi'}</li>
            <li>
              Database:{' '}
              {status.data.db.ok
                ? `✅ D1 kết nối (${status.data.db.latencyMs}ms)`
                : `❌ ${status.data.db.error}`}
            </li>
          </ul>
        )}
      </section>

      <Button variant="outline" onClick={() => void recheck()}>
        Kiểm tra lại
      </Button>
    </main>
  )
}

export default App
