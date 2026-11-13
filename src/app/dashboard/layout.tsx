import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: 'Quản lý thiệp — Thiệp Hồng',
  robots: { index: false },
}

export default function DashboardLayout({ children }: LayoutProps<'/dashboard'>) {
  return (
    <>
      {children}
      <Toaster position="top-center" />
    </>
  )
}
