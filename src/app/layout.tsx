import type { Metadata } from 'next'
import { Geist, Geist_Mono, Newsreader } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin', 'vietnamese'],
  // Trang thiệp dùng font riêng của template → không preload font giao diện chung
  preload: false,
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  preload: false,
})

// Font tiêu đề của giao diện quản lý (wordmark Thiệp Hồng, tên cặp đôi)
const newsreader = Newsreader({
  variable: '--font-display',
  subsets: ['latin', 'vietnamese'],
  style: ['normal', 'italic'],
  preload: false,
})

export const metadata: Metadata = {
  // Dùng để tạo URL tuyệt đối cho ảnh preview (og:image). Trên Vercel đặt NEXT_PUBLIC_SITE_URL.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'Thiệp Hồng — Thiệp cưới online',
  description: 'Tạo thiệp cưới online miễn phí, gửi link riêng cho từng khách mời.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
