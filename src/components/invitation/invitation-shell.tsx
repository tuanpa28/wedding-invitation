'use client'

import { Music, VolumeX } from 'lucide-react'
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'

/** closed: đang hiện phong bì · opening: đang chạy hiệu ứng mở · open: đã vào thiệp */
export type InvitationPhase = 'closed' | 'opening' | 'open'

/** Thời gian hiệu ứng mở phong bì (khớp với duration trong CSS của các template) */
export const OPEN_DURATION_MS = 1400

type InvitationContextValue = {
  phase: InvitationPhase
  open: () => void
  hasMusic: boolean
  playing: boolean
  toggleMusic: () => void
}

const InvitationContext = createContext<InvitationContextValue | null>(null)

export function useInvitation() {
  const ctx = use(InvitationContext)
  if (!ctx) throw new Error('useInvitation phải nằm trong <InvitationShell>')
  return ctx
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

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
  children,
}: {
  musicUrl?: string
  className?: string
  style?: CSSProperties
  musicButtonClassName?: string
  children: ReactNode
}) {
  const [phase, setPhase] = useState<InvitationPhase>('closed')
  const [playing, setPlaying] = useState(false)
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
    window.setTimeout(() => setPhase('open'), prefersReducedMotion() ? 0 : OPEN_DURATION_MS)
  }, [phase, playMusic])

  const toggleMusic = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) playMusic()
    else audio.pause()
  }, [playMusic])

  const value = useMemo(
    () => ({ phase, open, hasMusic: Boolean(musicUrl), playing, toggleMusic }),
    [phase, open, musicUrl, playing, toggleMusic],
  )

  return (
    <InvitationContext value={value}>
      <div data-phase={phase} className={cn('group/inv relative', className)} style={style}>
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
