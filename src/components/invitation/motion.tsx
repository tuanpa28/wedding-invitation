'use client'

// Bộ hiệu ứng dùng chung cho 3 template (Motion + Lenis).
// Hiệu ứng luôn chạy, kể cả khi máy bật "giảm chuyển động" (MotionConfig reducedMotion="never"
// trong InvitationShell).
import { m, useScroll, useTransform, type HTMLMotionProps, type Variants } from 'motion/react'
import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useInvitation } from './invitation-shell'

/** Đường cong chuyển động chung: nhanh đầu, chậm cuối (kiểu điện ảnh) */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const

/* ------------------------------------------------------------------ */
/* Cuộn mượt                                                           */
/* ------------------------------------------------------------------ */

/** Bật Lenis (cuộn mượt có quán tính) khi thiệp đã mở */
export function SmoothScroll({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return
    let lenis: { destroy: () => void; resize: () => void } | undefined
    let cancelled = false
    // Lenis chỉ tính lại chiều cao trang khi <html> đổi kích thước, mà <html> cao cố định (h-full).
    // Nội dung dài thêm sau khi mở (hiện mã QR, lời chúc tải về...) thì phải báo cho Lenis,
    // nếu không trang bị chặn ở đáy cũ và không cuộn tới được phần cuối.
    const observer = new ResizeObserver(() => lenis?.resize())
    // Chỉ tải Lenis khi khách đã mở thiệp
    void import('lenis').then(({ default: Lenis }) => {
      if (cancelled) return
      lenis = new Lenis({ autoRaf: true, lerp: 0.1 })
      observer.observe(document.body)
    })
    return () => {
      cancelled = true
      observer.disconnect()
      lenis?.destroy()
    }
  }, [enabled])
  return null
}

/* ------------------------------------------------------------------ */
/* Hiện khi cuộn tới                                                   */
/* ------------------------------------------------------------------ */

export type RevealVariant = 'rise' | 'fade' | 'zoom' | 'left' | 'right' | 'blur'

const REVEAL: Record<RevealVariant, Variants> = {
  rise: { hidden: { opacity: 0, y: 36 }, shown: { opacity: 1, y: 0 } },
  fade: { hidden: { opacity: 0 }, shown: { opacity: 1 } },
  zoom: { hidden: { opacity: 0, scale: 0.92 }, shown: { opacity: 1, scale: 1 } },
  left: { hidden: { opacity: 0, x: -40 }, shown: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: 40 }, shown: { opacity: 1, x: 0 } },
  blur: {
    hidden: { opacity: 0, y: 16, filter: 'blur(8px)' },
    shown: { opacity: 1, y: 0, filter: 'blur(0px)' },
  },
}

type MotionTag = 'div' | 'section' | 'li' | 'header' | 'footer' | 'figure' | 'p' | 'ol' | 'ul'

/** Phần tử trượt/hiện dần khi cuộn tới (một lần). Bọc nhiều `RevealItem` để chạy lần lượt. */
export function Reveal({
  as = 'div',
  variant = 'rise',
  delay = 0,
  stagger,
  className,
  style,
  children,
}: {
  as?: MotionTag
  variant?: RevealVariant
  delay?: number
  /** Khoảng cách giữa các RevealItem con (giây) */
  stagger?: number
  className?: string
  style?: CSSProperties
  children: ReactNode
}) {
  const Tag = m[as] as typeof m.div
  return (
    <Tag
      className={className}
      style={style}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.2, margin: '0px 0px -8% 0px' }}
      variants={{
        hidden: REVEAL[variant].hidden,
        shown: {
          ...(REVEAL[variant].shown as object),
          transition: {
            duration: 0.9,
            ease: EASE_OUT,
            delay,
            ...(stagger ? { staggerChildren: stagger, delayChildren: delay + 0.1 } : {}),
          },
        },
      }}
    >
      {children}
    </Tag>
  )
}

/** Con của Reveal có `stagger`: lần lượt hiện theo thứ tự */
export function RevealItem({
  as = 'div',
  variant = 'rise',
  className,
  children,
}: {
  as?: MotionTag
  variant?: RevealVariant
  className?: string
  children: ReactNode
}) {
  const Tag = m[as] as typeof m.div
  return (
    <Tag
      className={className}
      variants={{
        hidden: REVEAL[variant].hidden,
        shown: {
          ...(REVEAL[variant].shown as object),
          transition: { duration: 0.8, ease: EASE_OUT },
        },
      }}
    >
      {children}
    </Tag>
  )
}

/* ------------------------------------------------------------------ */
/* Màn mở đầu (chạy khi khách bấm mở thiệp)                             */
/* ------------------------------------------------------------------ */

/** true khi khách đã bấm mở thiệp (đang mở hoặc đã mở xong) */
export function useOpened() {
  return useInvitation().phase !== 'closed'
}

/** Phần tử của phần đầu thiệp: hiện sau khi mở, trễ `delay` giây (để khớp hiệu ứng mở phong bì) */
export function HeroItem({
  delay = 0,
  variant = 'blur',
  className,
  children,
  ...rest
}: {
  delay?: number
  variant?: RevealVariant
  className?: string
  children: ReactNode
} & Omit<HTMLMotionProps<'div'>, 'children'>) {
  const opened = useOpened()
  return (
    <m.div
      className={className}
      initial="hidden"
      animate={opened ? 'shown' : 'hidden'}
      variants={{
        hidden: REVEAL[variant].hidden,
        shown: {
          ...(REVEAL[variant].shown as object),
          transition: { duration: 1.1, ease: EASE_OUT, delay },
        },
      }}
      {...rest}
    >
      {children}
    </m.div>
  )
}

/** Tách chuỗi thành ký tự hiển thị (giữ nguyên chữ có dấu tiếng Việt) */
function graphemes(text: string) {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter('vi', { granularity: 'grapheme' })
    return Array.from(segmenter.segment(text), (s) => s.segment)
  }
  return Array.from(text.normalize('NFC'))
}

/**
 * Chữ hiện lần lượt từng ký tự sau khi mở thiệp.
 * - `letters`: từng ký tự bay lên + rõ dần (tên cô dâu chú rể)
 * - `write`: quét từ trái sang phải như đang viết tay (font viết tay)
 */
export function AnimatedText({
  text,
  delay = 0,
  mode = 'letters',
  className,
  charDelay = 0.045,
}: {
  text: string
  delay?: number
  mode?: 'letters' | 'write'
  className?: string
  charDelay?: number
}) {
  const opened = useOpened()
  const chars = useMemo(() => graphemes(text), [text])

  if (mode === 'write') {
    return (
      <m.span
        className={cn('inline-block', className)}
        initial={{ clipPath: 'inset(-20% 100% -20% 0)', opacity: 0 }}
        animate={opened ? { clipPath: 'inset(-20% -5% -20% 0)', opacity: 1 } : undefined}
        transition={{ duration: 0.12 * chars.length + 0.4, ease: 'easeInOut', delay }}
      >
        {text}
      </m.span>
    )
  }

  return (
    <span className={cn('inline-block', className)}>
      <span className="sr-only">{text}</span>
      {chars.map((char, i) => (
        <m.span
          key={i}
          aria-hidden
          className="inline-block whitespace-pre"
          initial={{ opacity: 0, y: '0.45em', filter: 'blur(6px)' }}
          animate={opened ? { opacity: 1, y: 0, filter: 'blur(0px)' } : undefined}
          transition={{ duration: 0.8, ease: EASE_OUT, delay: delay + i * charDelay }}
        >
          {char}
        </m.span>
      ))}
    </span>
  )
}

/** Dòng chữ trồi lên từ sau "mặt nạ" (kiểu tạp chí) — dùng cho template tối giản */
export function MaskLine({
  children,
  delay = 0,
  className,
  onOpen = true,
}: {
  children: ReactNode
  delay?: number
  className?: string
  /** true: chạy khi mở thiệp; false: chạy ngay khi hiện trên màn hình */
  onOpen?: boolean
}) {
  const opened = useOpened()
  const animate = onOpen ? (opened ? { y: '0%' } : undefined) : { y: '0%' }
  return (
    <span className={cn('block overflow-hidden pb-[0.08em]', className)}>
      <m.span
        className="block"
        initial={{ y: '110%' }}
        animate={animate}
        transition={{ duration: 1.1, ease: EASE_OUT, delay }}
      >
        {children}
      </m.span>
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Ảnh                                                                 */
/* ------------------------------------------------------------------ */

/** Ảnh trôi chậm hơn trang khi cuộn (parallax) + phóng to nhẹ rồi thu về khi mở thiệp */
export function ParallaxImage({
  children,
  className,
  strength = 40,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  /** Độ lệch tối đa (px) khi cuộn qua */
  strength?: number
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const opened = useOpened()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [-strength, strength])

  return (
    <div ref={ref} className={cn('relative overflow-hidden', className)}>
      <m.div
        className="absolute inset-x-0 -inset-y-[12%]"
        style={{ y }}
        initial={{ scale: 1.18 }}
        animate={opened ? { scale: 1 } : undefined}
        transition={{ duration: 2.6, ease: EASE_OUT, delay }}
      >
        {children}
      </m.div>
    </div>
  )
}

/** Khung ảnh mở dần như rèm kéo (clip-path) khi cuộn tới */
export function CurtainReveal({
  children,
  className,
  from = 'bottom',
  delay = 0,
}: {
  children: ReactNode
  className?: string
  from?: 'bottom' | 'left'
  delay?: number
}) {
  // Hai trạng thái cùng dạng inset(top right bottom left) để Motion nội suy được
  const [hidden, shown] =
    from === 'bottom'
      ? ['inset(100% 0% 0% 0%)', 'inset(0% 0% 0% 0%)']
      : ['inset(0% 100% 0% 0%)', 'inset(0% 0% 0% 0%)']
  return (
    <m.div
      className={className}
      initial={{ clipPath: hidden }}
      whileInView={{ clipPath: shown }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 1.4, ease: EASE_OUT, delay }}
    >
      {children}
    </m.div>
  )
}

/* ------------------------------------------------------------------ */
/* Đường kẻ / hoạ tiết tự vẽ                                           */
/* ------------------------------------------------------------------ */

/** Đường kẻ ngang tự kéo dài khi cuộn tới */
export function GrowLine({
  className,
  origin = 'left',
}: {
  className?: string
  origin?: 'left' | 'center'
}) {
  return (
    <m.div
      aria-hidden
      className={className}
      style={{ originX: origin === 'left' ? 0 : 0.5 }}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 1.2, ease: EASE_OUT }}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Hạt rơi (cánh hoa, kim tuyến, lá)                                   */
/* ------------------------------------------------------------------ */

export type ParticleShape = 'petal' | 'spark' | 'leaf'

/** Số giả ngẫu nhiên ổn định theo chỉ số (render giống nhau mỗi lần) */
const rand = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

/**
 * Hạt rơi nhẹ phủ toàn màn hình sau khi mở thiệp. Chạy bằng CSS animation
 * (keyframes `th-fall` trong globals.css) để nhẹ máy.
 */
export function FallingParticles({
  shapes,
  colors,
  count = 14,
}: {
  shapes: ParticleShape[]
  colors: string[]
  count?: number
}) {
  const { phase } = useInvitation()
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        shape: shapes[i % shapes.length],
        color: colors[i % colors.length],
        left: `${rand(i, 1) * 100}%`,
        size: 8 + rand(i, 2) * 10,
        duration: 9 + rand(i, 3) * 9,
        delay: -rand(i, 4) * 18,
        drift: `${(rand(i, 5) - 0.5) * 160}px`,
        spin: `${(rand(i, 6) > 0.5 ? 1 : -1) * (180 + rand(i, 7) * 360)}deg`,
      })),
    [count, shapes, colors],
  )

  if (phase !== 'open') return null

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {particles.map((p, i) => (
        <span
          key={i}
          className="th-particle absolute -top-8 block"
          style={
            {
              left: p.left,
              width: p.size,
              height: p.size,
              '--th-duration': `${p.duration}s`,
              '--th-delay': `${p.delay}s`,
              '--th-drift': p.drift,
              '--th-spin': p.spin,
            } as CSSProperties
          }
        >
          <ParticleShapeSvg shape={p.shape} color={p.color} />
        </span>
      ))}
    </div>
  )
}

function ParticleShapeSvg({ shape, color }: { shape: ParticleShape; color: string }) {
  if (shape === 'spark') {
    return (
      <svg viewBox="0 0 20 20" className="size-full opacity-80">
        <path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z" fill={color} />
      </svg>
    )
  }
  if (shape === 'leaf') {
    return (
      <svg viewBox="0 0 20 20" className="size-full opacity-70">
        <path d="M2 18 C 2 8, 8 2, 18 2 C 18 12, 12 18, 2 18 Z" fill={color} />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 20 20" className="size-full opacity-75">
      <path d="M10 1 C 16 4, 18 12, 10 19 C 2 12, 4 4, 10 1 Z" fill={color} />
    </svg>
  )
}
