import { MapPin } from 'lucide-react'
import { mapsUrl } from '@/lib/invitation/helpers'
import type { WeddingEvent } from '@/lib/invitation/types'
import { cn } from '@/lib/utils'

/** Nút "Chỉ đường": mở link Google Maps admin dán vào, không có thì tìm theo địa chỉ */
export function EventActions({
  event,
  className,
  buttonClassName,
}: {
  event: WeddingEvent
  className?: string
  buttonClassName?: string
}) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      <a
        href={mapsUrl(event)}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'inline-flex min-h-11 items-center justify-center gap-2 px-4 text-sm transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          buttonClassName,
        )}
      >
        <MapPin className="size-4" aria-hidden />
        Chỉ đường
      </a>
    </div>
  )
}
