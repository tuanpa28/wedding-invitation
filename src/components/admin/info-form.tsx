'use client'

import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Person } from '@/lib/invitation/types'
import { infoSchema } from '@/lib/validators/wedding'
import { errorMessage, type EditorFormProps } from './editor-types'
import { Field, issuesToErrors, SectionTitle } from './field'
import { SaveBar } from './save-bar'

type InfoDraft = { groom: Person; bride: Person; quote: string }

/** Thông tin cô dâu, chú rể, bố mẹ hai bên và câu trích dẫn */
export function InfoForm({ wedding, onSave }: EditorFormProps) {
  const [saved, setSaved] = useState<InfoDraft>(() => ({
    groom: wedding.groom,
    bride: wedding.bride,
    quote: wedding.quote ?? '',
  }))
  const [draft, setDraft] = useState(saved)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)

  const setPerson = (who: 'groom' | 'bride', key: keyof Person, value: string) =>
    setDraft((d) => ({ ...d, [who]: { ...d[who], [key]: value } }))

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = infoSchema.safeParse(draft)
    if (!parsed.success) {
      setErrors(issuesToErrors(parsed.error.issues))
      toast.error('Kiểm tra lại các ô báo đỏ')
      return
    }
    setErrors({})
    setPending(true)
    try {
      const { groom, bride, quote } = parsed.data
      await onSave({ groom, bride, quote: quote ?? null })
      setSaved(draft)
      toast.success('Đã lưu thông tin')
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-10" noValidate>
      <section className="grid gap-6 lg:grid-cols-2">
        <PersonFields
          who="groom"
          title="Nhà trai"
          person={draft.groom}
          errors={errors}
          onChange={setPerson}
        />
        <PersonFields
          who="bride"
          title="Nhà gái"
          person={draft.bride}
          errors={errors}
          onChange={setPerson}
        />
      </section>

      <section className="grid gap-4">
        <SectionTitle>Lời mở đầu</SectionTitle>
        <Field
          id="quote"
          label="Câu trích dẫn"
          hint="In nhỏ ở đầu thiệp. Có thể để trống."
          error={errors.quote}
        >
          <Textarea
            id="quote"
            value={draft.quote}
            onChange={(e) => setDraft((d) => ({ ...d, quote: e.target.value }))}
            maxLength={300}
            rows={2}
          />
        </Field>
      </section>

      <SaveBar dirty={dirty} pending={pending} />
    </form>
  )
}

const PERSON_FIELDS: { key: keyof Person; label: string; hint?: string; required?: boolean }[] = [
  {
    key: 'shortName',
    label: 'Tên gọi',
    hint: 'In to trên thiệp, ví dụ "Minh Tuấn"',
    required: true,
  },
  { key: 'fullName', label: 'Họ tên đầy đủ', required: true },
  { key: 'title', label: 'Thứ bậc', hint: 'Ví dụ "Trưởng nam", "Út nữ"' },
  { key: 'father', label: 'Tên bố', hint: 'Ví dụ "Ông Nguyễn Văn Hùng"' },
  { key: 'mother', label: 'Tên mẹ', hint: 'Ví dụ "Bà Trần Thị Mai"' },
  { key: 'address', label: 'Địa chỉ nhà', hint: 'In dưới tên bố mẹ' },
]

function PersonFields({
  who,
  title,
  person,
  errors,
  onChange,
}: {
  who: 'groom' | 'bride'
  title: string
  person: Person
  errors: Record<string, string>
  onChange: (who: 'groom' | 'bride', key: keyof Person, value: string) => void
}) {
  return (
    <div className="grid content-start gap-4 rounded-xl border bg-card p-5">
      <SectionTitle>{title}</SectionTitle>
      {PERSON_FIELDS.map(({ key, label, hint, required }) => {
        const id = `${who}-${key}`
        const error = errors[`${who}.${key}`]
        return (
          <Field key={key} id={id} label={label} hint={hint} error={error}>
            <Input
              id={id}
              value={(person[key] as string | undefined) ?? ''}
              onChange={(e) => onChange(who, key, e.target.value)}
              required={required}
              aria-invalid={Boolean(error)}
            />
          </Field>
        )
      })}
    </div>
  )
}
