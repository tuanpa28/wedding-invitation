'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/** Khoảng cách tới mép màn hình khi cột đứng yên (px), khớp `md:top-6` cũ */
const GAP = 24

/**
 * Cột đứng yên khi cuộn (sticky) mà không có thanh cuộn riêng.
 * Cột thấp hơn màn hình: dính ở trên như bình thường. Cột cao hơn màn hình: `top` âm đúng bằng
 * phần dư, nên cột cuộn theo trang tới khi thấy hết phần dưới rồi mới đứng yên.
 */
export function StickyColumn({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      el.style.top = `${Math.min(GAP, window.innerHeight - el.offsetHeight - GAP)}px`
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    window.addEventListener('resize', update)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <aside ref={ref} className={className}>
      {children}
    </aside>
  )
}
