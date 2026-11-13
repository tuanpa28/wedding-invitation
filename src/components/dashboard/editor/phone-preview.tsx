'use client'

import { ExternalLink } from 'lucide-react'

export type PreviewSide = 'all' | 'groom' | 'bride'

const SIDES: { value: PreviewSide; label: string }[] = [
  { value: 'all', label: 'Link chung' },
  { value: 'groom', label: 'Khách nhà trai' },
  { value: 'bride', label: 'Khách nhà gái' },
]

/**
 * Khung điện thoại hiển thị đúng trang thiệp khách sẽ thấy (iframe tới trang xem trước).
 * `version` đổi sau mỗi lần lưu → iframe tải lại.
 */
export function PhonePreview({
  src,
  version,
  side,
  onSideChange,
  hasEvents,
}: {
  src: string
  version: number
  side: PreviewSide
  onSideChange: (side: PreviewSide) => void
  hasEvents: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        role="radiogroup"
        aria-label="Xem như"
        className="inline-flex rounded-full border bg-card p-0.5 text-xs"
      >
        {SIDES.map((s) => (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={side === s.value}
            onClick={() => onSideChange(s.value)}
            className="rounded-full px-3 py-1.5 text-muted-foreground transition outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 aria-checked:bg-foreground aria-checked:text-background"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Màn hình 360×754 thu nhỏ còn 296×620 để vừa cột bên phải */}
      <div className="relative h-[640px] w-[316px] rounded-[2.75rem] bg-foreground p-2.5 shadow-[0_30px_60px_-30px_rgb(38_22_29/0.55)]">
        <div className="relative h-full w-full overflow-hidden rounded-[2.2rem] bg-background">
          {hasEvents ? (
            <iframe
              key={`${src}#${version}`}
              src={src}
              title="Xem trước thiệp"
              className="absolute top-0 left-0 h-[754px] w-[360px] origin-top-left scale-[0.8222] border-0"
            />
          ) : (
            <div className="grid h-full place-items-center p-8 text-center text-sm text-muted-foreground">
              Thêm ít nhất một sự kiện để xem trước thiệp.
            </div>
          )}
        </div>
        <span
          aria-hidden
          className="absolute top-4 left-1/2 h-1.5 w-16 -translate-x-1/2 rounded-full bg-background/20"
        />
      </div>

      <a
        href={src}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ExternalLink className="size-3.5" /> Mở toàn màn hình
      </a>
    </div>
  )
}
