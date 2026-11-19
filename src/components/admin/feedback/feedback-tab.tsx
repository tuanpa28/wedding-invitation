'use client'

import { Eye, EyeOff, FileDown, Loader2, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import writeXlsxFile from 'write-excel-file/browser'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { rsvpStats, rsvpState } from '@/lib/feedback'
import {
  deleteRsvp,
  deleteWish,
  setWishHidden,
  subscribeAllWishes,
  subscribeGuests,
  subscribeRsvps,
  type AdminGuest,
  type AdminRsvp,
  type AdminWish,
} from '@/lib/firebase/admin-client'
import { SIDE_LABEL } from '@/lib/invitation/helpers'
import { cn } from '@/lib/utils'
import { errorMessage, type EditorFormProps } from '../editor-types'
import { SectionTitle } from '../field'

const dateTime = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Asia/Ho_Chi_Minh',
})

/** Phản hồi của khách: xác nhận dự tiệc + sổ lưu bút, kèm cài đặt bật/tắt */
export function FeedbackTab({ wedding, onSave }: EditorFormProps) {
  const [rsvps, setRsvps] = useState<AdminRsvp[] | null>(null)
  const [wishes, setWishes] = useState<AdminWish[] | null>(null)
  const [guests, setGuests] = useState<AdminGuest[]>([])

  useEffect(() => {
    const onError = (error: unknown) => toast.error(errorMessage(error, 'Không tải được dữ liệu'))
    const unsubs = [
      subscribeRsvps(setRsvps, onError),
      subscribeAllWishes(setWishes, onError),
      subscribeGuests(setGuests, onError),
    ]
    return () => unsubs.forEach((u) => u())
  }, [])

  const stats = useMemo(
    () =>
      rsvpStats(
        rsvps ?? [],
        guests.map((g) => g.code),
      ),
    [rsvps, guests],
  )

  return (
    <div className="flex flex-col gap-10 pb-10">
      <Settings wedding={wedding} onSave={onSave} />

      <section className="grid gap-4">
        <SectionTitle
          aside={
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!rsvps?.length}
              onClick={() => void exportRsvps(rsvps ?? [])}
            >
              <FileDown /> Xuất Excel
            </Button>
          }
        >
          Xác nhận tham dự
        </SectionTitle>

        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat
            label="Sẽ đến"
            value={stats.people}
            hint={`${stats.attendingResponses} phản hồi`}
            accent
          />
          <Stat
            label="Theo bên"
            value={`${stats.peopleBySide.groom} · ${stats.peopleBySide.bride}`}
            hint="nhà trai · nhà gái"
          />
          <Stat label="Không đến" value={stats.declined} />
          <Stat label="Chưa phản hồi" value={stats.pendingGuests} hint="khách có link riêng" />
        </dl>

        {rsvps === null ? (
          <div className="h-24 animate-pulse rounded-xl bg-muted" />
        ) : rsvps.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Chưa có ai xác nhận. Khách gửi ở cuối thiệp, phần &quot;Xác nhận tham dự&quot;.
          </p>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {rsvps.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-1 p-4 sm:flex-row sm:items-start sm:gap-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {r.name}
                    {!r.guestCode && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        (link chung)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {SIDE_LABEL[r.side]}
                    {r.updatedAt && ` · ${dateTime.format(r.updatedAt)}`}
                  </p>
                  {r.note && <p className="mt-1 text-sm italic">“{r.note}”</p>}
                </div>
                <p
                  className={cn(
                    'text-sm font-medium',
                    r.attending ? 'text-gold' : 'text-muted-foreground',
                  )}
                >
                  {r.attending ? `Sẽ đến · ${r.count} người` : 'Không đến được'}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Xoá phản hồi của ${r.name}`}
                  title="Xoá phản hồi"
                  onClick={() => deleteRsvp(r.id).catch((e) => toast.error(errorMessage(e)))}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-4">
        <SectionTitle
          aside={
            wishes && (
              <span className="text-sm text-muted-foreground">
                {wishes.filter((w) => !w.hidden).length} hiển thị ·{' '}
                {wishes.filter((w) => w.hidden).length} đã ẩn
              </span>
            )
          }
        >
          Sổ lưu bút
        </SectionTitle>
        {wishes === null ? (
          <div className="h-24 animate-pulse rounded-xl bg-muted" />
        ) : wishes.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Chưa có lời chúc nào.
          </p>
        ) : (
          <ul className="grid gap-2">
            {wishes.map((w) => (
              <li
                key={w.id}
                className={cn('flex gap-3 rounded-xl border bg-card p-4', w.hidden && 'opacity-55')}
              >
                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-line">{w.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{w.name}</span>
                    {w.side && ` · ${SIDE_LABEL[w.side]}`}
                    {w.createdAt && ` · ${dateTime.format(w.createdAt)}`}
                    {w.hidden && ' · đang ẩn'}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    title={w.hidden ? 'Hiện lại' : 'Ẩn khỏi thiệp'}
                    aria-label={w.hidden ? 'Hiện lại lời chúc' : 'Ẩn lời chúc'}
                    onClick={() =>
                      setWishHidden(w.id, !w.hidden).catch((e) => toast.error(errorMessage(e)))
                    }
                  >
                    {w.hidden ? <Eye /> : <EyeOff />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    title="Xoá vĩnh viễn"
                    aria-label="Xoá lời chúc"
                    onClick={() => {
                      if (window.confirm('Xoá vĩnh viễn lời chúc này?')) {
                        deleteWish(w.id).catch((e) => toast.error(errorMessage(e)))
                      }
                    }}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Settings({ wedding, onSave }: EditorFormProps) {
  const [deadline, setDeadline] = useState(wedding.rsvpDeadline ?? '')
  const [pending, setPending] = useState<string | null>(null)
  const state = rsvpState(wedding)

  async function save(key: string, patch: Parameters<typeof onSave>[0], done: string) {
    setPending(key)
    try {
      await onSave(patch)
      toast.success(done)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setPending(null)
    }
  }

  const rsvpOn = wedding.rsvpEnabled !== false
  const wishesOn = wedding.wishesEnabled !== false

  return (
    <section className="grid gap-4 rounded-xl border bg-card p-5">
      <SectionTitle>Cài đặt</SectionTitle>
      <Toggle
        label="Form xác nhận tham dự"
        description={
          state === 'closed'
            ? 'Đang đóng vì đã quá hạn xác nhận'
            : 'Khách báo có đến không, đi mấy người'
        }
        checked={rsvpOn}
        pending={pending === 'rsvp'}
        onChange={(on) =>
          save(
            'rsvp',
            { rsvpEnabled: on ? null : false },
            on ? 'Đã bật xác nhận tham dự' : 'Đã tắt xác nhận tham dự',
          )
        }
      />
      <div className="flex flex-wrap items-end gap-2 pl-1">
        <label className="grid gap-1.5 text-sm">
          Hạn xác nhận{' '}
          <span className="text-xs text-muted-foreground">(để trống nếu không có hạn)</span>
          <Input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-44"
          />
        </label>
        <Button
          type="button"
          variant="secondary"
          disabled={deadline === (wedding.rsvpDeadline ?? '') || pending === 'deadline'}
          onClick={() =>
            save(
              'deadline',
              { rsvpDeadline: deadline || null },
              deadline ? 'Đã đặt hạn xác nhận' : 'Đã bỏ hạn xác nhận',
            )
          }
        >
          {pending === 'deadline' && <Loader2 className="animate-spin" />}
          Lưu hạn
        </Button>
      </div>
      <Toggle
        label="Sổ lưu bút"
        description="Khách gửi lời chúc, hiện ngay trên thiệp"
        checked={wishesOn}
        pending={pending === 'wishes'}
        onChange={(on) =>
          save(
            'wishes',
            { wishesEnabled: on ? null : false },
            on ? 'Đã bật sổ lưu bút' : 'Đã tắt sổ lưu bút',
          )
        }
      />
    </section>
  )
}

function Toggle({
  label,
  description,
  checked,
  pending,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  pending: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={pending}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-60',
          checked ? 'bg-primary' : 'bg-input',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform',
            checked && 'translate-x-5',
          )}
        />
      </button>
    </label>
  )
}

function Stat({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string
  value: number | string
  hint?: string
  accent?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card px-4 py-3',
        accent && 'border-gold/30 bg-gold-soft/50',
      )}
    >
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1">
        <span className={cn('font-display text-3xl', accent && 'text-gold')}>{value}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </dd>
    </div>
  )
}

function exportRsvps(rsvps: AdminRsvp[]) {
  const bold = (value: string) => ({ value, fontWeight: 'bold' as const })
  return writeXlsxFile(
    [
      ['Tên', 'Bên', 'Có đến', 'Số người', 'Lời nhắn', 'Mã khách', 'Cập nhật'].map(bold),
      ...rsvps.map((r) => [
        { value: r.name },
        { value: SIDE_LABEL[r.side] },
        { value: r.attending ? 'Có' : 'Không' },
        { value: r.count },
        { value: r.note ?? '' },
        { value: r.guestCode ?? '(link chung)' },
        { value: r.updatedAt ? dateTime.format(r.updatedAt) : '' },
      ]),
    ],
    {
      columns: [
        { width: 26 },
        { width: 10 },
        { width: 8 },
        { width: 9 },
        { width: 36 },
        { width: 14 },
        { width: 18 },
      ],
    },
  ).toFile('xac-nhan-tham-du.xlsx')
}
