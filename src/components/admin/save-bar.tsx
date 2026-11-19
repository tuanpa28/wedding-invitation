'use client'

import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** Thanh lưu dính đáy: chỉ nổi bật khi có thay đổi chưa lưu */
export function SaveBar({
  dirty,
  pending,
  label = 'Lưu thay đổi',
}: {
  dirty: boolean
  pending: boolean
  label?: string
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-8 flex items-center justify-end gap-3 border-t bg-background/90 px-4 py-3 backdrop-blur">
      <p className="mr-auto text-sm text-muted-foreground" aria-live="polite">
        {dirty ? 'Có thay đổi chưa lưu' : 'Đã lưu'}
      </p>
      <Button type="submit" disabled={!dirty || pending}>
        {pending && <Loader2 className="animate-spin" />}
        {label}
      </Button>
    </div>
  )
}
