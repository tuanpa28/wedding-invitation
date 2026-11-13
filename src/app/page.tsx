import { SystemStatus } from '@/components/system-status'

export default function Home() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-rose-50 p-6 text-center">
      <h1 className="text-4xl font-semibold text-rose-700">Thiệp Hồng</h1>
      <p className="text-muted-foreground">Nền tảng thiệp cưới online — đang xây dựng</p>
      <SystemStatus />
    </main>
  )
}
