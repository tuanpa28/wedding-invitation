'use client'

import { Loader2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createGuest, updateGuest, type AdminGuest } from '@/lib/firebase/admin-client'
import { guestSchema } from '@/lib/guests'
import type { Side } from '@/lib/invitation/types'
import { errorMessage } from '../editor-types'
import { Field, issuesToErrors } from '../field'

type Draft = {
  code: string
  displayName: string
  side: Side | ''
  group: string
  maxAttendees: string
}

/** Thêm hoặc sửa một khách. Mã link chỉ đặt được lúc thêm (là id của khách). */
export function GuestDialog({
  open,
  onOpenChange,
  guest,
  newCode,
  groups,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Khách đang sửa; không có → thêm mới */
  guest?: AdminGuest
  /** Mã gợi ý cho khách mới */
  newCode: string
  /** Các nhóm đã có, để gợi ý */
  groups: string[]
}) {
  const editing = Boolean(guest)
  const initial: Draft = guest
    ? {
        code: guest.code,
        displayName: guest.displayName,
        side: guest.side,
        group: guest.group ?? '',
        maxAttendees: guest.maxAttendees ? String(guest.maxAttendees) : '',
      }
    : { code: newCode, displayName: '', side: '', group: '', maxAttendees: '' }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* key: mở lại dialog thì form về giá trị ban đầu */}
        {open && (
          <GuestForm
            key={guest?.code ?? newCode}
            initial={initial}
            editing={editing}
            groups={groups}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function GuestForm({
  initial,
  editing,
  groups,
  onDone,
}: {
  initial: Draft
  editing: boolean
  groups: string[]
  onDone: () => void
}) {
  const [draft, setDraft] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }))

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = guestSchema.safeParse({
      ...draft,
      side: draft.side || undefined,
      maxAttendees: draft.maxAttendees ? Number(draft.maxAttendees) : undefined,
    })
    if (!parsed.success) {
      setErrors(issuesToErrors(parsed.error.issues))
      return
    }
    setErrors({})
    setPending(true)
    const { code, ...fields } = parsed.data
    try {
      if (editing) await updateGuest(code, fields)
      else await createGuest(code, fields)
      toast.success(editing ? 'Đã lưu khách' : `Đã thêm ${fields.displayName}`)
      onDone()
    } catch (error) {
      if ((error as { code?: string }).code === 'already-exists') {
        setErrors({ code: 'Mã này đã có khách khác dùng' })
      } else {
        toast.error(errorMessage(error))
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      <DialogHeader>
        <DialogTitle>{editing ? 'Sửa khách' : 'Thêm khách'}</DialogTitle>
        <DialogDescription>
          Cách gọi in trên thiệp, ví dụ &quot;Anh Nam&quot;, &quot;Cô Hoa và gia đình&quot;.
        </DialogDescription>
      </DialogHeader>

      <Field id="guest-name" label="Cách gọi" error={errors.displayName}>
        <Input
          id="guest-name"
          value={draft.displayName}
          onChange={(e) => set({ displayName: e.target.value })}
          autoFocus
          maxLength={80}
          aria-invalid={Boolean(errors.displayName)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field id="guest-side" label="Khách bên" error={errors.side}>
          <Select value={draft.side} onValueChange={(side: Side) => set({ side })}>
            <SelectTrigger id="guest-side" className="w-full" aria-invalid={Boolean(errors.side)}>
              <SelectValue placeholder="Chọn bên" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="groom">Nhà trai</SelectItem>
              <SelectItem value="bride">Nhà gái</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field
          id="guest-count"
          label="Số người"
          hint="Để trống nếu không giới hạn"
          error={errors.maxAttendees}
        >
          <Input
            id="guest-count"
            type="number"
            inputMode="numeric"
            min={1}
            max={20}
            value={draft.maxAttendees}
            onChange={(e) => set({ maxAttendees: e.target.value })}
            aria-invalid={Boolean(errors.maxAttendees)}
          />
        </Field>
      </div>

      <Field
        id="guest-group"
        label="Nhóm"
        hint="Để lọc danh sách, ví dụ Họ hàng, Đồng nghiệp"
        error={errors.group}
      >
        <Input
          id="guest-group"
          value={draft.group}
          onChange={(e) => set({ group: e.target.value })}
          list="guest-groups"
          maxLength={40}
        />
        <datalist id="guest-groups">
          {groups.map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>
      </Field>

      <Field
        id="guest-code"
        label="Mã link"
        hint={
          editing ? 'Không đổi được sau khi tạo' : 'Tự sinh ngẫu nhiên; sửa được nếu muốn mã dễ nhớ'
        }
        error={errors.code}
      >
        <Input
          id="guest-code"
          value={draft.code}
          onChange={(e) => set({ code: e.target.value.trim() })}
          disabled={editing}
          className="font-mono"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={Boolean(errors.code)}
        />
      </Field>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          Huỷ
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />}
          {editing ? 'Lưu' : 'Thêm khách'}
        </Button>
      </DialogFooter>
    </form>
  )
}
