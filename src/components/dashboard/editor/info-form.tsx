'use client'

import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { api, ApiError } from '@/lib/api-client'
import type { Person, TemplateId } from '@/lib/invitation/types'
import { useOrigin } from '@/lib/use-origin'
import { weddingInfoSchema } from '@/lib/validators/wedding'
import type { WeddingEditData } from '@/server/services/weddings'
import { TemplatePicker } from '../template-picker'
import { Field, issuesToErrors, SectionTitle } from './field'
import { SaveBar } from './save-bar'

type InfoDraft = {
  slug: string
  templateId: TemplateId
  groom: Person
  bride: Person
  quote: string
}

const toDraft = (w: WeddingEditData): InfoDraft => ({
  slug: w.slug,
  templateId: w.templateId,
  groom: w.groom,
  bride: w.bride,
  quote: w.quote ?? '',
})

export function InfoForm({
  wedding,
  onSaved,
}: {
  wedding: WeddingEditData
  onSaved: (patch: Partial<WeddingEditData>) => void
}) {
  const origin = useOrigin()
  const [saved, setSaved] = useState(() => toDraft(wedding))
  const [draft, setDraft] = useState(saved)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)

  const setPerson = (who: 'groom' | 'bride', key: keyof Person, value: string) =>
    setDraft((d) => ({ ...d, [who]: { ...d[who], [key]: value } }))

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const parsed = weddingInfoSchema.safeParse(draft)
    if (!parsed.success) {
      setErrors(issuesToErrors(parsed.error.issues))
      toast.error('Kiểm tra lại các ô báo đỏ')
      return
    }
    setErrors({})
    setPending(true)
    try {
      await api(`/api/weddings/${wedding.id}`, { method: 'PATCH', body: draft }) // gửi dữ liệu gốc; server tự kiểm tra + chuẩn hoá
      setSaved(draft)
      onSaved({
        slug: parsed.data.slug,
        templateId: parsed.data.templateId,
        groom: parsed.data.groom,
        bride: parsed.data.bride,
        quote: parsed.data.quote ?? null,
      })
      toast.success('Đã lưu thông tin')
    } catch (error) {
      if (error instanceof ApiError && error.code === 'slug_taken') {
        setErrors({ slug: error.message })
      }
      toast.error(error instanceof ApiError ? error.message : 'Không lưu được')
    } finally {
      setPending(false)
    }
  }

  const published = wedding.status === 'published'

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-10" noValidate>
      <section className="grid gap-4">
        <SectionTitle>Mẫu thiệp</SectionTitle>
        <TemplatePicker
          value={draft.templateId}
          onChange={(templateId) => setDraft((d) => ({ ...d, templateId }))}
        />
      </section>

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
        <SectionTitle>Lời mở đầu &amp; đường dẫn</SectionTitle>
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
        <Field
          id="slug"
          label="Đường dẫn"
          error={errors.slug}
          hint={
            published
              ? 'Thiệp đã gửi: đổi đường dẫn thì link cũ khách đang giữ sẽ không mở được.'
              : `${origin}/${draft.slug}`
          }
        >
          <Input
            id="slug"
            value={draft.slug}
            onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value.toLowerCase() }))}
            className="font-mono"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={Boolean(errors.slug)}
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
