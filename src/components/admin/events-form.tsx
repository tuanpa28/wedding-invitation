'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { isoToVnLocal, vnLocalToIso } from '@/lib/invitation/slug'
import { EVENT_TITLE, type EventSide, type WeddingEvent } from '@/lib/invitation/types'
import { eventsSchema } from '@/lib/validators/wedding'
import { errorMessage, type EditorFormProps } from './editor-types'
import { Field, issuesToErrors } from './field'
import { SaveBar } from './save-bar'

type EventDraft = {
  key: string
  side: EventSide
  /** "2027-01-09T10:30" theo giờ Việt Nam */
  local: string
  venue: string
  address: string
  mapUrl: string
  lunarText: string
}

const SIDE_OPTIONS: { value: EventSide; label: string }[] = [
  { value: 'groom', label: 'Nhà trai' },
  { value: 'bride', label: 'Nhà gái' },
  { value: 'both', label: 'Chung hai bên' },
]

/** Lễ của mỗi bên hiện ở link nào */
const SHOWN_ON: Record<EventSide, string> = {
  groom: 'Hiện ở link khách nhà trai',
  bride: 'Hiện ở link khách nhà gái',
  both: 'Hiện ở link chung',
}

const SIDE_ORDER = SIDE_OPTIONS.map((o) => o.value)
const bySide = (a: EventDraft, b: EventDraft) =>
  SIDE_ORDER.indexOf(a.side) - SIDE_ORDER.indexOf(b.side)

const newKey = () => Math.random().toString(36).slice(2)

// Mỗi bên chỉ một Lễ Thành Hôn: dữ liệu cũ có nhiều sự kiện một bên thì giữ sự kiện đầu tiên
const toDrafts = (events: WeddingEvent[]): EventDraft[] =>
  events
    .filter((e, i) => events.findIndex((x) => x.side === e.side) === i)
    .map((e) => ({
      key: e.id,
      side: e.side,
      local: isoToVnLocal(e.startAt),
      venue: e.venue,
      address: e.address,
      mapUrl: e.mapUrl ?? '',
      lunarText: e.lunarText ?? '',
    }))
    .sort(bySide)

const toInput = (d: EventDraft) => ({
  id: d.key,
  side: d.side,
  type: 'thanh_hon' as const,
  title: EVENT_TITLE,
  startAt: vnLocalToIso(d.local),
  venue: d.venue,
  address: d.address,
  mapUrl: d.mapUrl,
  lunarText: d.lunarText,
})

export function EventsForm({ wedding, onSave }: EditorFormProps) {
  const [saved, setSaved] = useState(() => toDrafts(wedding.events))
  const [drafts, setDrafts] = useState(saved)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)
  const dirty = JSON.stringify(drafts) !== JSON.stringify(saved)

  const update = (key: string, patch: Partial<EventDraft>) =>
    setDrafts((list) => list.map((d) => (d.key === key ? { ...d, ...patch } : d)))

  function add(side: EventSide) {
    setDrafts((list) =>
      [
        ...list,
        { key: newKey(), side, local: '', venue: '', address: '', mapUrl: '', lunarText: '' },
      ].sort(bySide),
    )
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = eventsSchema.safeParse({ events: drafts.map(toInput) })
    if (!parsed.success) {
      setErrors(issuesToErrors(parsed.error.issues))
      toast.error('Kiểm tra lại các ô báo đỏ')
      return
    }
    setErrors({})
    setPending(true)
    try {
      await onSave({ events: parsed.data.events })
      setSaved(drafts)
      toast.success('Đã lưu sự kiện')
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setPending(false)
    }
  }

  const missing = SIDE_OPTIONS.filter((o) => !drafts.some((d) => d.side === o.value))

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <p className="text-sm text-muted-foreground">
        Mỗi bên có tối đa một Lễ Thành Hôn. Khách nhà trai chỉ thấy lễ nhà trai, khách nhà gái chỉ
        thấy lễ nhà gái. Link chung chỉ hiện lễ chung hai bên; chưa có lễ chung thì link chung vẫn
        mở được thiệp nhưng không có ngày giờ. Giờ tính theo giờ Việt Nam.
      </p>

      {drafts.length === 0 && (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Chưa có sự kiện nào. Thêm Lễ Thành Hôn của nhà trai, nhà gái hoặc chung hai bên.
        </div>
      )}

      <ol className="grid gap-4">
        {drafts.map((d, i) => {
          const err = (field: string) => errors[`events.${i}.${field}`]
          const id = (field: string) => `ev-${d.key}-${field}`
          return (
            <li
              key={d.key}
              className="rounded-xl border bg-card p-5 data-[side=bride]:border-l-4 data-[side=bride]:border-l-primary/60 data-[side=groom]:border-l-4 data-[side=groom]:border-l-foreground/40"
              data-side={d.side}
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <p className="flex flex-wrap items-center gap-2 font-display text-lg">
                  {EVENT_TITLE}
                  <span className="font-sans text-sm text-muted-foreground">
                    · {SIDE_OPTIONS.find((o) => o.value === d.side)?.label}
                  </span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 font-sans text-xs font-medium text-primary">
                    {SHOWN_ON[d.side]}
                  </span>
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setDrafts((list) => list.filter((x) => x.key !== d.key))}
                  title="Xoá sự kiện"
                >
                  <Trash2 />
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field id={id('local')} label="Ngày giờ" error={err('startAt')}>
                  <Input
                    id={id('local')}
                    type="datetime-local"
                    value={d.local}
                    onChange={(e) => update(d.key, { local: e.target.value })}
                    aria-invalid={Boolean(err('startAt'))}
                  />
                </Field>
                <Field
                  id={id('lunar')}
                  label="Ngày âm lịch"
                  hint='Ví dụ "Tức ngày 02 tháng Chạp năm Bính Ngọ"'
                  error={err('lunarText')}
                  className="sm:col-span-2"
                >
                  <Input
                    id={id('lunar')}
                    value={d.lunarText}
                    onChange={(e) => update(d.key, { lunarText: e.target.value })}
                  />
                </Field>
                <Field id={id('venue')} label="Nơi tổ chức" error={err('venue')}>
                  <Input
                    id={id('venue')}
                    value={d.venue}
                    onChange={(e) => update(d.key, { venue: e.target.value })}
                    placeholder="Tư gia nhà gái / Nhà hàng …"
                    aria-invalid={Boolean(err('venue'))}
                  />
                </Field>
                <Field id={id('address')} label="Địa chỉ" error={err('address')}>
                  <Input
                    id={id('address')}
                    value={d.address}
                    onChange={(e) => update(d.key, { address: e.target.value })}
                    aria-invalid={Boolean(err('address'))}
                  />
                </Field>
                <Field
                  id={id('map')}
                  label="Link Google Maps"
                  hint="Để trống thì nút chỉ đường tìm theo địa chỉ"
                  error={err('mapUrl')}
                  className="sm:col-span-2"
                >
                  <Input
                    id={id('map')}
                    type="url"
                    value={d.mapUrl}
                    onChange={(e) => update(d.key, { mapUrl: e.target.value })}
                    placeholder="https://maps.app.goo.gl/…"
                    aria-invalid={Boolean(err('mapUrl'))}
                  />
                </Field>
              </div>
            </li>
          )
        })}
      </ol>

      {missing.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {missing.map((o) => (
            <Button key={o.value} type="button" variant="outline" onClick={() => add(o.value)}>
              <Plus /> {o.value === 'both' ? 'Sự kiện chung' : `Sự kiện ${o.label.toLowerCase()}`}
            </Button>
          ))}
        </div>
      )}
      {errors.events && <p className="text-sm text-destructive">{errors.events}</p>}

      <SaveBar dirty={dirty} pending={pending} />
    </form>
  )
}
