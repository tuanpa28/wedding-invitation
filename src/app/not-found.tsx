import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-rose-50 px-6 text-center">
      <p className="text-sm tracking-[0.3em] text-rose-700/70 uppercase">Thiệp Hồng</p>
      <h1 className="text-2xl font-semibold text-rose-800">Không tìm thấy thiệp</h1>
      <p className="max-w-sm text-muted-foreground">
        Link thiệp có thể bị gõ sai hoặc thiệp chưa được công bố. Bạn kiểm tra lại link trong tin
        nhắn mời nhé.
      </p>
      <Link href="/" className="mt-2 text-rose-700 underline underline-offset-4">
        Về trang chủ
      </Link>
    </main>
  )
}
