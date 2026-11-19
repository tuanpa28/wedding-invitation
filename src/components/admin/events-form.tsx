'use client'

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LIMITS } from '@/lib/invitation/defaults'
import { isoToVnLocal, vnLocalToIso } from '@/lib/invitation/slug'
import type { EventSide, EventType, WeddingEvent } from '@/lib/invitation/types'
import { EVENT_TYPE_LABEL, eventsSchema } from '@/lib/validators/wedding'
import { errorMessage, type EditorFormProps } from './editor-types'
import { Field, issuesToErrors } from './field'
import { SaveBar } from './save-bar'

type EventDraft = {
  key: string
  side: EventSide
  type: EventType
  title: string
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

const DEFAULT_TYPE: Record<EventSide, EventType> = {
  groom: 'thanh_hon',
  bride: 'vu_quy',
  both: 'tiec_cuoi',
}

const newKey = () => Math.random().toString(36).slice(2)

const toDrafts = (events: WeddingEvent[]): EventDraft[] =>
  events.map((e) => ({
    key: e.id,
    side: e.side,
    type: e.type,
    title: e.title,
    local: isoToVnLocal(e.startAt),
    venue: e.venue,
    address: e.address,
    mapUrl: e.mapUrl ?? '',
    lunarText: e.lunarText ?? '',
  }))

const toInput = (d: EventDraft) => ({
  id: d.key,
  side: d.side,
  type: d.type,
  title: d.title,
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
    const type = DEFAULT_TYPE[side]
    setDrafts((list) => [
      ...list,
      {
        key: newKey(),
        side,
        type,
        title: EVENT_TYPE_LABEL[type],
        local: '',
        venue: '',
        address: '',
        mapUrl: '',
        lunarText: '',
      },
    ])
  }

  function move(index: number, delta: number) {
    setDrafts((list) => {
      const next = [...list]
      const [item] = next.splice(index, 1)
      next.splice(index + delta, 0, item)
      return next
    })
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

  const full = drafts.length >= LIMITS.events

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <p className="text-sm text-muted-foreground">
        Khách nhà trai chỉ thấy sự kiện của nhà trai và sự kiện chung; khách nhà gái cũng vậy. Giờ
        tính theo giờ Việt Nam.
      </p>

      {drafts.length === 0 && (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Chưa có sự kiện nào. Thêm Lễ Vu Quy, Lễ Thành Hôn hoặc tiệc cưới của từng bên.
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
                <p className="font-display text-lg">{d.title || EVENT_TYPE_LABEL[d.type]}</p>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    title="Lên trên"
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => move(i, 1)}
                    disabled={i === drafts.length - 1}
                    title="Xuống dưới"
                  >
                    <ArrowDown />
                  </Button>
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
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field id={id('side')} label="Bên tổ chức">
                  <Select
                    value={d.side}
                    onValueChange={(side: EventSide) => update(d.key, { side })}
                  >
                    <SelectTrigger id={id('side')} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SIDE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field id={id('type')} label="Loại lễ">
                  <Select
                    value={d.type}
                    onValueChange={(type: EventType) =>
                      update(d.key, {
                        type,
                        // Tên còn là tên mặc định thì đổi theo loại lễ
                        title:
                          d.title === '' || d.title === EVENT_TYPE_LABEL[d.type]
                            ? EVENT_TYPE_LABEL[type]
                            : d.title,
                      })
                    }
                  >
                    <SelectTrigger id={id('type')} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EVENT_TYPE_LABEL).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field id={id('title')} label="Tên sự kiện" error={err('title')}>
                  <Input
                    id={id('title')}
                    value={d.title}
                    onChange={(e) => update(d.key, { title: e.target.value })}
                    aria-invalid={Boolean(err('title'))}
                  />
                </Field>
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

      <div className="flex flex-wrap gap-2">
        {SIDE_OPTIONS.map((o) => (
          <Button
            key={o.value}
            type="button"
            variant="outline"
            onClick={() => add(o.value)}
            disabled={full}
          >
            <Plus /> {o.value === 'both' ? 'Sự kiện chung' : `Sự kiện ${o.label.toLowerCase()}`}
          </Button>
        ))}
      </div>
      {errors.events && <p className="text-sm text-destructive">{errors.events}</p>}

      <SaveBar dirty={dirty} pending={pending} />
    </form>
  )
}
