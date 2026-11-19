'use client'

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react'
import { Reveal as MotionReveal, type RevealVariant } from './motion'

type RevealTag = 'div' | 'section' | 'li' | 'header' | 'footer' | 'figure' | 'p' | 'ol' | 'ul'

/**
 * Hiện dần khi cuộn tới.
 * - Mặc định: hiệu ứng Motion (`variant`: rise, fade, zoom, left, right, blur).
 * - `plain`: không có hiệu ứng sẵn, chỉ gắn `data-shown` để CSS của template tự vẽ
 *   (cành hoa tự mọc, vòng khoanh ngày cưới...).
 */
export function Reveal({
  as = 'div',
  className,
  style,
  children,
  plain = false,
  variant,
  delay,
  stagger,
}: {
  as?: RevealTag
  className?: string
  style?: CSSProperties
  children: ReactNode
  plain?: boolean
  variant?: RevealVariant
  delay?: number
  stagger?: number
}) {
  if (!plain) {
    return (
      <MotionReveal
        as={as}
        className={className}
        style={style}
        variant={variant}
        delay={delay}
        stagger={stagger}
      >
        {children}
      </MotionReveal>
    )
  }
  return (
    <PlainReveal as={as} className={className} style={style}>
      {children}
    </PlainReveal>
  )
}

function PlainReveal({
  as: Tag,
  className,
  style,
  children,
}: {
  as: ElementType
  className?: string
  style?: CSSProperties
  children: ReactNode
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
    <Tag ref={ref} data-shown={shown ? '' : undefined} className={className} style={style}>
      {children}
    </Tag>
  )
}
