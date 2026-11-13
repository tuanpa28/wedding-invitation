'use client'

import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { WeddingImage as Image } from '@/components/invitation/wedding-image'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Photo } from '@/lib/invitation/types'
import { cn } from '@/lib/utils'

/**
 * Album ảnh + lightbox (dùng thẻ <dialog> gốc: tự khoá focus, Esc để đóng).
 * Lightbox hỗ trợ phím mũi tên và vuốt trái/phải trên điện thoại.
 */
export function Album({
  photos,
  className,
  itemClassName,
  imageClassName,
  sizes = '(min-width: 640px) 320px, 50vw',
}: {
  photos: Photo[]
  className?: string
  itemClassName?: string
  imageClassName?: string
  sizes?: string
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [index, setIndex] = useState<number | null>(null)
  const touchStartX = useRef<number | null>(null)

  const openAt = (i: number) => {
    setIndex(i)
    dialogRef.current?.showModal()
  }

  const close = () => dialogRef.current?.close()

  const step = useCallback(
    (delta: number) =>
      setIndex((i) => (i === null ? i : (i + delta + photos.length) % photos.length)),
    [photos.length],
  )

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    const onClose = () => setIndex(null)
    dialog.addEventListener('keydown', onKey)
    dialog.addEventListener('close', onClose)
    return () => {
      dialog.removeEventListener('keydown', onKey)
      dialog.removeEventListener('close', onClose)
    }
  }, [step])

  const current = index === null ? null : photos[index]
  const columns = splitIntoColumns(photos, 2)

  return (
    <>
      <div className={cn('grid grid-cols-2 items-start gap-2', className)}>
        {columns.map((column, ci) => (
          <ul key={ci} className="flex flex-col gap-[inherit]">
            {column.map(({ photo, index: i }) => (
              <li key={photo.src} className={itemClassName}>
                <button
                  type="button"
                  onClick={() => openAt(i)}
                  className="block w-full overflow-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  aria-label={`Xem ảnh lớn: ${photo.alt}`}
                >
                  <Image
                    src={photo.src}
                    width={photo.width}
                    height={photo.height}
                    alt={photo.alt}
                    sizes={sizes}
                    className={cn(
                      'h-auto w-full transition duration-500 hover:scale-[1.03] motion-reduce:transition-none',
                      imageClassName,
                    )}
                  />
                </button>
              </li>
            ))}
          </ul>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        aria-label="Xem ảnh"
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-black/95 p-0 text-white backdrop:bg-black/80"
        onClick={(e) => {
          if (e.target === e.currentTarget) close()
        }}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return
          const dx = e.changedTouches[0].clientX - touchStartX.current
          if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1)
          touchStartX.current = null
        }}
      >
        {current && (
          <div className="relative flex h-full w-full items-center justify-center">
            <Image
              key={current.src}
              src={current.src}
              width={current.width}
              height={current.height}
              alt={current.alt}
              sizes="100vw"
              className="max-h-[85dvh] w-auto max-w-full object-contain"
            />
            <p className="absolute top-4 left-4 text-sm text-white/80 tabular-nums">
              {(index ?? 0) + 1} / {photos.length}
            </p>
            <LightboxButton label="Đóng" onClick={close} className="top-2 right-2">
              <X className="size-6" aria-hidden />
            </LightboxButton>
            <LightboxButton
              label="Ảnh trước"
              onClick={() => step(-1)}
              className="top-1/2 left-2 -translate-y-1/2"
            >
              <ChevronLeft className="size-7" aria-hidden />
            </LightboxButton>
            <LightboxButton
              label="Ảnh sau"
              onClick={() => step(1)}
              className="top-1/2 right-2 -translate-y-1/2"
            >
              <ChevronRight className="size-7" aria-hidden />
            </LightboxButton>
          </div>
        )}
      </dialog>
    </>
  )
}

/** Chia ảnh vào các cột sao cho chiều cao các cột gần bằng nhau (ảnh mới vào cột thấp nhất) */
export function splitIntoColumns(photos: Photo[], count: number) {
  const columns = Array.from({ length: count }, () => ({
    height: 0,
    items: [] as { photo: Photo; index: number }[],
  }))
  photos.forEach((photo, index) => {
    const shortest = columns.reduce((min, col) => (col.height < min.height ? col : min))
    shortest.items.push({ photo, index })
    shortest.height += photo.height / photo.width
  })
  return columns.map((col) => col.items)
}

function LightboxButton({
  label,
  onClick,
  className,
  children,
}: {
  label: string
  onClick: () => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'absolute grid size-12 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none',
        className,
      )}
    >
      {children}
    </button>
  )
}
