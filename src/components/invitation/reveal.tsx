'use client'

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Gắn `data-shown` khi phần tử cuộn vào màn hình. Template tự quyết định hiệu ứng
 * qua class `data-shown:*` (mặc định: hiện dần + trượt lên nhẹ).
 */
export function Reveal({
  as: Tag = 'div',
  className,
  children,
  plain = false,
}: {
  as?: ElementType
  className?: string
  children: ReactNode
  /** Không dùng hiệu ứng mặc định, chỉ gắn data-shown */
  plain?: boolean
}) {
  const ref = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      data-shown={shown ? '' : undefined}
      className={cn(
        !plain &&
          'translate-y-6 opacity-0 transition duration-700 ease-out data-shown:translate-y-0 data-shown:opacity-100 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none',
        className,
      )}
    >
      {children}
    </Tag>
  )
}
