'use client'

import { Music, VolumeX } from 'lucide-react'
import { LazyMotion, MotionConfig } from 'motion/react'
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'
import { SmoothScroll } from './motion'

const loadMotionFeatures = () => import('./motion-features').then((mod) => mod.default)

/** closed: đang hiện phong bì · opening: đang chạy hiệu ứng mở · open: đã vào thiệp */
export type InvitationPhase = 'closed' | 'opening' | 'open'

/** Thời gian mặc định của hiệu ứng mở phong bì (template truyền `openDuration` nếu khác) */
export const OPEN_DURATION_MS = 1400

type InvitationContextValue = {
  phase: InvitationPhase
  open: () => void
  hasMusic: boolean
  playing: boolean
  toggleMusic: () => void
  /** Có giảm chuyển động không (theo hệ điều hành, trừ khi URL có ?motion=full) */
  reducedMotion: boolean
}

const InvitationContext = createContext<InvitationContextValue | null>(null)

export function useInvitation() {
  const ctx = use(InvitationContext)
  if (!ctx) throw new Error('useInvitation phải nằm trong <InvitationShell>')
  return ctx
}

/** ?motion=full: luôn chạy hiệu ứng kể cả khi máy bật "giảm chuyển động" (xem trước trong trang quản lý) */
function readForceMotion() {
  return new URL(window.location.href).searchParams.get('motion') === 'full'
}
const subscribeNothing = () => () => {}

/**
 * "Giảm chuyển động" của hệ điều hành. Không dùng useReducedMotion() của Motion: hook đó đọc
 * matchMedia ngay lần render đầu ở trình duyệt, khác HTML dựng sẵn (server luôn là false)
 * → lỗi hydration. useSyncExternalStore dùng giá trị server khi hydrate rồi mới đổi.
 */
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)'
function subscribeReducedMotion(onChange: () => void) {
  const mql = window.matchMedia(REDUCED_QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}
const readReducedMotion = () => window.matchMedia(REDUCED_QUERY).matches

/**
 * Khung chung của mọi template: giữ trạng thái phong bì + nhạc nền.
 * Gắn `data-phase` lên thẻ gốc để CSS của template chạy hiệu ứng
 * (dùng variant Tailwind `group-data-[phase=opening]/inv:`).
 */
export function InvitationShell({
  musicUrl,
  className,
  style,
  musicButtonClassName,
  openDuration = OPEN_DURATION_MS,
  children,
}: {
  musicUrl?: string
  className?: string
  style?: CSSProperties
  musicButtonClassName?: string
  /** Thời gian (ms) từ lúc bấm mở tới khi gỡ phong bì, khớp hiệu ứng của template */
  openDuration?: number
  children: ReactNode
}) {
  const [phase, setPhase] = useState<InvitationPhase>('closed')
  const [playing, setPlaying] = useState(false)
  // Đọc sau khi hydrate: thiệp được dựng sẵn HTML lúc build, lần render đầu phải giống HTML đó
  const forceMotion = useSyncExternalStore(subscribeNothing, readForceMotion, () => false)
  const systemReduced = useSyncExternalStore(subscribeReducedMotion, readReducedMotion, () => false)
  const reducedMotion = systemReduced && !forceMotion
  const audioRef = useRef<HTMLAudioElement>(null)

  // Khoá cuộn trang khi phong bì đang che
  useEffect(() => {
    if (phase === 'open') return
    const html = document.documentElement
    const previous = html.style.overflow
    html.style.overflow = 'hidden'
    return () => {
      html.style.overflow = previous
    }
  }, [phase])

  const playMusic = useCallback(() => {
    // Trình duyệt chỉ cho phát nhạc sau thao tác của người dùng → gọi trong onClick
    audioRef.current?.play().catch(() => setPlaying(false))
  }, [])

  const open = useCallback(() => {
    if (phase !== 'closed') return
    window.scrollTo(0, 0)
    setPhase('opening')
    playMusic()
    window.setTimeout(() => setPhase('open'), reducedMotion ? 0 : openDuration)
  }, [phase, playMusic, openDuration, reducedMotion])

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) playMusic()
    else audio.pause()
  }, [playMusic])

  const value = useMemo(
    () => ({ phase, open, hasMusic: Boolean(musicUrl), playing, toggleMusic, reducedMotion }),
    [phase, open, musicUrl, playing, toggleMusic, reducedMotion],
  )

  return (
    <InvitationContext value={value}>
      <LazyMotion features={loadMotionFeatures} strict>
        <MotionConfig reducedMotion={forceMotion ? 'never' : 'user'}>
          <SmoothScroll enabled={phase === 'open' && !reducedMotion} />
          <div
            data-phase={phase}
            data-motion={forceMotion ? 'full' : undefined}
            className={cn('group/inv relative', className)}
            style={style}
          >
            {children}
            {musicUrl && (
              <>
                <audio
                  ref={audioRef}
                  src={musicUrl}
                  preload="none"
                  loop
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                />
                {phase === 'open' && <MusicToggle className={musicButtonClassName} />}
              </>
            )}
          </div>
        </MotionConfig>
      </LazyMotion>
    </InvitationContext>
  )
}

/** Lớp phủ phong bì: tự gỡ khỏi DOM khi đã mở xong */
export function CoverOverlay({ className, children }: { className?: string; children: ReactNode }) {
  const { phase } = useInvitation()
  if (phase === 'open') return null
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Thiệp mời"
      className={cn('fixed inset-0 z-50 overflow-hidden', className)}
    >
      {children}
    </div>
  )
}

export function OpenInvitationButton({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  const { open, phase } = useInvitation()
  return (
    <button type="button" onClick={open} disabled={phase !== 'closed'} className={className}>
      {children}
    </button>
  )
}

function MusicToggle({ className }: { className?: string }) {
  const { playing, toggleMusic } = useInvitation()
  return (
    <button
      type="button"
      onClick={toggleMusic}
      aria-label={playing ? 'Tắt nhạc' : 'Bật nhạc'}
      aria-pressed={playing}
      className={cn(
        'fixed right-4 bottom-4 z-40 grid size-11 place-items-center rounded-full shadow-lg transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        className,
      )}
    >
      {playing ? (
        <Music className="size-5 motion-safe:animate-[spin_4s_linear_infinite]" aria-hidden />
      ) : (
        <VolumeX className="size-5" aria-hidden />
      )}
    </button>
  )
}
