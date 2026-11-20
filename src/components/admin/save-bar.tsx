'use client'

import { Check, Loader2 } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useReportDirty } from './dirty'

/**
 * Thanh lưu dính đáy của một form: báo trạng thái chưa lưu cho menu, và Ctrl/⌘+S để lưu
 * (chỉ form đang hiện trên màn hình).
 */
export function SaveBar({
  dirty,
  pending,
  label = 'Lưu thay đổi',
}: {
  dirty: boolean
  pending: boolean
  label?: string
}) {
  const bar = useRef<HTMLDivElement>(null)
  useReportDirty(dirty, useId())

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 's') return
      const form = bar.current?.closest('form')
      // Tab đang ẩn thì form không có kích thước → bỏ qua
      if (!form || form.getClientRects().length === 0) return
      event.preventDefault()
      if (dirty && !pending) form.requestSubmit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dirty, pending])

  return (
    <div
      ref={bar}
      className={cn(
        'sticky bottom-0 z-10 -mx-4 mt-8 flex items-center justify-end gap-3 border-t px-4 py-3 backdrop-blur transition-colors',
        dirty ? 'border-primary/30 bg-primary/5' : 'bg-background/90',
      )}
    >
      <p
        className={cn(
          'mr-auto flex items-center gap-1.5 text-sm',
          dirty ? 'font-medium text-primary' : 'text-muted-foreground',
        )}
        aria-live="polite"
      >
        {dirty ? (
          <>
            <span aria-hidden className="size-2 rounded-full bg-primary" />
            Có thay đổi chưa lưu
            <kbd className="ml-1 hidden rounded border bg-background px-1.5 font-mono text-[11px] font-normal text-muted-foreground sm:inline">
              Ctrl S
            </kbd>
          </>
        ) : (
          <>
            <Check className="size-4" /> Đã lưu
          </>
        )}
      </p>
      <Button type="submit" disabled={!dirty || pending}>
        {pending && <Loader2 className="animate-spin" />}
        {label}
      </Button>
    </div>
  )
}
