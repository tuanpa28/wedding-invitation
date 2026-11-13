'use client'

import { CalendarPlus, MapPin } from 'lucide-react'
import { buildIcs, googleCalendarUrl, mapsUrl, type CalendarCouple } from '@/lib/invitation/helpers'
import type { WeddingEvent } from '@/lib/invitation/types'
import { cn } from '@/lib/utils'

function isApplePlatform() {
  return /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)
}

/** Nút "Chỉ đường" + "Lưu vào lịch". iPhone/Mac tải file .ics, còn lại mở Google Calendar. */
export function EventActions({
  event,
  couple,
  className,
  buttonClassName,
}: {
  event: WeddingEvent
  couple: CalendarCouple
  className?: string
  buttonClassName?: string
}) {
  const saveToCalendar = () => {
    if (!isApplePlatform()) {
      window.open(googleCalendarUrl(event, couple), '_blank', 'noopener')
      return
    }
    const blob = new Blob([buildIcs(event, couple, Date.now())], {
      type: 'text/calendar;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${event.id}.ics`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const base = cn(
    'inline-flex min-h-11 items-center justify-center gap-2 px-4 text-sm transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
    buttonClassName,
  )

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      <a href={mapsUrl(event)} target="_blank" rel="noopener noreferrer" className={base}>
        <MapPin className="size-4" aria-hidden />
        Chỉ đường
      </a>
      <button type="button" onClick={saveToCalendar} className={base}>
        <CalendarPlus className="size-4" aria-hidden />
        Lưu vào lịch
      </button>
    </div>
  )
}
