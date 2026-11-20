'use client'

import { Check, Minus, Plus } from 'lucide-react'
import { useMemo, useState, useSyncExternalStore, type FormEvent } from 'react'
import {
  DEFAULT_MAX_ATTENDEES,
  formatDeadline,
  loadSavedRsvp,
  rsvpIdFor,
  rsvpSchema,
  rsvpState,
  saveRsvpLocally,
} from '@/lib/feedback'
import { submitRsvp } from '@/lib/firebase/public-data'
import { SIDE_LABEL } from '@/lib/invitation/helpers'
import type { Guest, Invitation, RsvpInput, Side } from '@/lib/invitation/types'
import { cn } from '@/lib/utils'
import { fieldClass, primaryButtonClass } from './styles'

type Status = 'idle' | 'sending' | 'done' | 'error'

/**
 * Form xác nhận dự tiệc. Màu lấy từ biến CSS --fb-* do template đặt.
 * Link riêng: tên + bên đã biết, mỗi khách một bản ghi (sửa được). Link chung: khách tự điền.
 */
export function RsvpForm({ invitation, guest }: { invitation: Invitation; guest?: Guest }) {
  // Thiệp được dựng sẵn lúc build: lần render đầu phải giống HTML có sẵn, nên giá trị
  // riêng của máy khách (giờ hiện tại, câu trả lời đã lưu) chỉ đọc sau khi hydrate.
  const minute = useSyncExternalStore(subscribeNothing, currentMinute, () => 0)
  const hydrated = minute > 0
  const state = rsvpState(invitation, minute * 60_000)
  const code = guest?.code
  const local = useMemo(() => {
    if (!hydrated) return null
    const id = rsvpIdFor(code)
    return { id, saved: loadSavedRsvp(id) }
  }, [hydrated, code])
  const [justSaved, setJustSaved] = useState<RsvpInput | null>(null)
  const [editing, setEditing] = useState(false)
  const id = local?.id ?? ''
  const saved = justSaved ?? local?.saved ?? null

  if (state === 'disabled') return null
  if (state === 'closed') {
    return (
      <p className="text-center text-(--fb-muted)">
        Đã hết hạn xác nhận. Nếu cần báo thay đổi, bạn nhắn trực tiếp cho cô dâu chú rể nhé.
      </p>
    )
  }

  if (saved && !editing) {
    return (
      <div className="rounded-(--fb-radius) border border-(--fb-line) bg-(--fb-card) p-6 text-center">
        <p className="mx-auto grid size-11 place-items-center rounded-full bg-(--fb-accent) text-(--fb-on-accent)">
          <Check className="size-5" aria-hidden />
        </p>
        <p className="mt-4 text-lg">
          {saved.attending
            ? `Cảm ơn ${saved.name}! Hẹn gặp ${saved.count > 1 ? `${saved.count} người` : 'bạn'} trong ngày vui.`
            : `Cảm ơn ${saved.name} đã báo. Tiếc quá, hẹn dịp khác nhé!`}
        </p>
        {saved.note && <p className="mt-2 text-sm text-(--fb-muted) italic">“{saved.note}”</p>}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-5 text-sm underline underline-offset-4 hover:text-(--fb-accent)"
        >
          Sửa câu trả lời
        </button>
      </div>
    )
  }

  return (
    <RsvpFields
      id={id}
      invitation={invitation}
      guest={guest}
      initial={saved}
      onSaved={(value) => {
        saveRsvpLocally(id, value)
        setJustSaved(value)
        setEditing(false)
      }}
    />
  )
}

const subscribeNothing = () => () => {}
/** Phút hiện tại (giá trị ổn định trong một phút, đủ cho hạn chót tính theo ngày) */
const currentMinute = () => Math.floor(Date.now() / 60_000)

function RsvpFields({
  id,
  invitation,
  guest,
  initial,
  onSaved,
}: {
  id: string
  invitation: Invitation
  guest?: Guest
  initial: RsvpInput | null
  onSaved: (value: RsvpInput) => void
}) {
  const max = guest?.maxAttendees
  const maxCount = max ?? DEFAULT_MAX_ATTENDEES
  const [name, setName] = useState(initial?.name ?? guest?.displayName ?? '')
  const [side, setSide] = useState<Side | undefined>(guest?.side ?? initial?.side)
  const [attending, setAttending] = useState<boolean | undefined>(initial?.attending)
  const [count, setCount] = useState(initial && initial.count > 0 ? initial.count : 1)
  const [note, setNote] = useState(initial?.note ?? '')
  const [honeypot, setHoneypot] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<Status>('idle')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (honeypot) return onSaved({ name, side: side ?? 'groom', attending: true, count: 1 }) // bot
    const parsed = rsvpSchema.safeParse({
      guestCode: guest?.code,
      name,
      side,
      attending,
      count: attending ? Math.min(count, maxCount) : 0,
      note,
    })
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message
      setErrors(next)
      return
    }
    setErrors({})
    setStatus('sending')
    try {
      await submitRsvp(id, parsed.data)
      setStatus('done')
      onSaved(parsed.data)
    } catch {
      setStatus('error')
    }
  }

  const choice = (value: boolean, label: string) => (
    <button
      type="button"
      role="radio"
      aria-checked={attending === value}
      onClick={() => setAttending(value)}
      className={cn(
        'min-h-12 flex-1 rounded-(--fb-radius) border px-3 text-sm transition',
        attending === value
          ? 'border-(--fb-accent) bg-(--fb-accent) text-(--fb-on-accent)'
          : 'border-(--fb-line) bg-(--fb-card) hover:border-(--fb-accent)',
      )}
    >
      {label}
    </button>
  )

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5 text-left">
      {invitation.rsvpDeadline && (
        <p className="text-center text-sm text-(--fb-muted)">
          Vui lòng xác nhận trước {formatDeadline(invitation.rsvpDeadline)}
        </p>
      )}

      <label className="grid gap-1.5">
        <span className="text-sm">Tên của bạn</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          className={fieldClass}
          aria-invalid={Boolean(errors.name)}
          autoComplete="name"
        />
        {errors.name && <span className="text-xs text-(--fb-error)">{errors.name}</span>}
      </label>

      {!guest && (
        <div className="grid gap-1.5" role="radiogroup" aria-label="Bạn là khách">
          <span className="text-sm">Bạn là khách</span>
          <div className="flex gap-2">
            {(['groom', 'bride'] as const).map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={side === s}
                onClick={() => setSide(s)}
                className={cn(
                  'min-h-11 flex-1 rounded-(--fb-radius) border text-sm transition',
                  side === s
                    ? 'border-(--fb-accent) text-(--fb-accent) ring-1 ring-(--fb-accent)'
                    : 'border-(--fb-line) bg-(--fb-card)',
                )}
              >
                {SIDE_LABEL[s]}
              </button>
            ))}
          </div>
          {errors.side && <span className="text-xs text-(--fb-error)">{errors.side}</span>}
        </div>
      )}

      <div className="grid gap-1.5">
        <span className="text-sm">Bạn sẽ đến chứ?</span>
        <div role="radiogroup" aria-label="Bạn sẽ đến chứ?" className="flex gap-2">
          {choice(true, 'Sẽ đến chung vui')}
          {choice(false, 'Không đến được')}
        </div>
        {errors.attending && <span className="text-xs text-(--fb-error)">{errors.attending}</span>}
      </div>

      {attending && (
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm">
            Số người{max ? <span className="text-(--fb-muted)"> (tối đa {max})</span> : null}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCount((c) => Math.max(1, c - 1))}
              disabled={count <= 1}
              aria-label="Bớt một người"
              className="grid size-10 place-items-center rounded-full border border-(--fb-line) disabled:opacity-40"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-6 text-center text-lg tabular-nums" aria-live="polite">
              {count}
            </span>
            <button
              type="button"
              onClick={() => setCount((c) => Math.min(maxCount, c + 1))}
              disabled={count >= maxCount}
              aria-label="Thêm một người"
              className="grid size-10 place-items-center rounded-full border border-(--fb-line) disabled:opacity-40"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>
      )}

      <label className="grid gap-1.5">
        <span className="text-sm">
          Lời nhắn <span className="text-(--fb-muted)">(ăn chay, đi cùng em bé…)</span>
        </span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          maxLength={300}
          className={fieldClass}
        />
      </label>

      {/* Bẫy bot: người thật không thấy ô này */}
      <input
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="absolute -left-[9999px] h-px w-px opacity-0"
        name="website"
      />

      <button type="submit" disabled={status === 'sending'} className={primaryButtonClass}>
        {status === 'sending' ? 'Đang gửi…' : 'Gửi xác nhận'}
      </button>
      {status === 'error' && (
        <p className="text-center text-sm text-(--fb-error)">
          Chưa gửi được, bạn kiểm tra mạng rồi thử lại nhé.
        </p>
      )}
    </form>
  )
}
