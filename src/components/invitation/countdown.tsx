'use client'

import { AnimatePresence, m } from 'motion/react'
import { useEffect, useState } from 'react'
import { countdownParts } from '@/lib/invitation/helpers'
import { cn } from '@/lib/utils'

const UNITS = [
  { key: 'days', label: 'Ngày' },
  { key: 'hours', label: 'Giờ' },
  { key: 'minutes', label: 'Phút' },
  { key: 'seconds', label: 'Giây' },
] as const

/** Đếm ngược tới sự kiện. Chỉ tính giờ ở trình duyệt để không lệch khi render phía server. */
export function Countdown({
  target,
  className,
  itemClassName,
  numberClassName,
  labelClassName,
  doneText = 'Hôm nay là ngày vui!',
}: {
  target: string
  className?: string
  itemClassName?: string
  numberClassName?: string
  labelClassName?: string
  doneText?: string
}) {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    const tick = () => setNow(Date.now())
    const first = window.setTimeout(tick, 0)
    const id = window.setInterval(tick, 1000)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(id)
    }
  }, [])

  const parts = now === null ? null : countdownParts(target, now)

  if (parts?.done) {
    return <p className={cn('text-center', className)}>{doneText}</p>
  }

  return (
    <div className={cn('grid grid-cols-4', className)} role="timer" aria-label="Thời gian còn lại">
      {UNITS.map(({ key, label }) => (
        <div key={key} className={cn('flex flex-col items-center', itemClassName)}>
          <RollingNumber
            value={parts ? String(parts[key]).padStart(2, '0') : '--'}
            className={numberClassName}
          />
          <span className={labelClassName}>{label}</span>
        </div>
      ))}
    </div>
  )
}

/** Số đổi giá trị thì trượt lên như bảng lật (giảm chuyển động: chỉ đổi số) */
function RollingNumber({ value, className }: { value: string; className?: string }) {
  return (
    <span className={cn('relative inline-flex overflow-hidden tabular-nums', className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <m.span
          key={value}
          initial={{ y: '-100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {value}
        </m.span>
      </AnimatePresence>
    </span>
  )
}
