'use client'

import { m } from 'motion/react'
import { useEffect, useState, type FormEvent } from 'react'
import { relativeTime, wishSchema } from '@/lib/feedback'
import { submitWish } from '@/lib/firebase/public-data'
import type { LiveWish } from '@/lib/firebase/wishes-live'
import { SIDE_LABEL } from '@/lib/invitation/helpers'
import type { Guest } from '@/lib/invitation/types'
import { useInvitation } from '../invitation-shell'
import { fieldClass, primaryButtonClass } from './styles'

/**
 * Sổ lưu bút: khách gửi lời chúc, danh sách cập nhật realtime.
 * Firestore bản đầy đủ (realtime) chỉ được tải sau khi khách đã mở thiệp (không làm chậm lúc tải trang).
 */
export function WishesBoard({ guest }: { guest?: Guest }) {
  const ready = useInvitation().phase === 'open'
  const [wishes, setWishes] = useState<LiveWish[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!ready) return
    let unsubscribe: (() => void) | undefined
    let cancelled = false
    void import('@/lib/firebase/wishes-live').then(({ subscribeVisibleWishes }) => {
      if (cancelled) return
      unsubscribe = subscribeVisibleWishes(setWishes, () => setFailed(true))
    })
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => {
      cancelled = true
      unsubscribe?.()
      window.clearInterval(timer)
    }
  }, [ready])

  return (
    <div className="grid gap-8">
      <WishForm guest={guest} />
      {failed ? (
        <p className="text-center text-sm text-(--fb-muted)">Chưa tải được lời chúc.</p>
      ) : wishes === null ? (
        <div className="h-24 animate-pulse rounded-(--fb-radius) bg-(--fb-line)/40" />
      ) : wishes.length === 0 ? (
        <p className="text-center text-(--fb-muted)">Hãy là người gửi lời chúc đầu tiên!</p>
      ) : (
        <ul className="grid gap-3" aria-live="polite">
          {wishes.map((w) => (
            <m.li
              key={w.id}
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-(--fb-radius) border border-(--fb-line) bg-(--fb-card) px-4 py-3 text-left"
            >
              <p className="leading-relaxed whitespace-pre-line">{w.message}</p>
              <p className="mt-2 flex flex-wrap gap-x-2 text-xs text-(--fb-muted)">
                <span className="font-semibold text-(--fb-ink)">{w.name}</span>
                {w.side && <span>· Khách {SIDE_LABEL[w.side].toLowerCase()}</span>}
                <span>· {relativeTime(w.createdAt, now)}</span>
              </p>
            </m.li>
          ))}
        </ul>
      )}
    </div>
  )
}

function WishForm({ guest }: { guest?: Guest }) {
  const [name, setName] = useState(guest?.displayName ?? '')
  const [message, setMessage] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (honeypot) return setStatus('sent')
    const parsed = wishSchema.safeParse({
      name,
      message,
      side: guest?.side,
      guestCode: guest?.code,
    })
    if (!parsed.success) return setError(parsed.error.issues[0].message)
    setError(null)
    setStatus('sending')
    try {
      await submitWish(parsed.data)
      setMessage('')
      setStatus('sent')
    } catch {
      setError('Chưa gửi được, bạn kiểm tra mạng rồi thử lại nhé.')
      setStatus('idle')
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-3 text-left">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tên của bạn"
        aria-label="Tên của bạn"
        maxLength={60}
        className={fieldClass}
        autoComplete="name"
      />
      <textarea
        value={message}
        onChange={(e) => {
          setMessage(e.target.value)
          if (status === 'sent') setStatus('idle')
        }}
        placeholder="Gửi đôi lời chúc tới cô dâu chú rể…"
        aria-label="Lời chúc"
        rows={3}
        maxLength={500}
        className={fieldClass}
      />
      <input
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="absolute -left-[9999px] h-px w-px opacity-0"
        name="website"
      />
      {error && <p className="text-sm text-(--fb-error)">{error}</p>}
      <button type="submit" disabled={status === 'sending'} className={primaryButtonClass}>
        {status === 'sending'
          ? 'Đang gửi…'
          : status === 'sent'
            ? 'Đã gửi — cảm ơn bạn!'
            : 'Gửi lời chúc'}
      </button>
    </form>
  )
}
