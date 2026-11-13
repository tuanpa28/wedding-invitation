'use client'

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { api, ApiError } from '@/lib/api-client'
import { LIMITS } from '@/lib/invitation/defaults'
import { storySchema, type StoryItemInput } from '@/lib/validators/wedding'
import type { WeddingEditData } from '@/server/services/weddings'
import { Field, issuesToErrors } from './field'
import { SaveBar } from './save-bar'

type StoryDraft = StoryItemInput & { key: string }

const newKey = () => Math.random().toString(36).slice(2)

export function StoryForm({
  wedding,
  onSaved,
}: {
  wedding: WeddingEditData
  onSaved: (patch: Partial<WeddingEditData>) => void
}) {
  const [saved, setSaved] = useState<StoryDraft[]>(() =>
    wedding.story.map((s) => ({ ...s, key: newKey() })),
  )
  const [drafts, setDrafts] = useState(saved)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)
  const dirty = JSON.stringify(drafts) !== JSON.stringify(saved)

  const update = (key: string, patch: Partial<StoryDraft>) =>
    setDrafts((list) => list.map((d) => (d.key === key ? { ...d, ...patch } : d)))

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
    const story = drafts.map(({ date, title, text, photo }) => ({ date, title, text, photo }))
    const parsed = storySchema.safeParse({ story })
    if (!parsed.success) {
      setErrors(issuesToErrors(parsed.error.issues))
      toast.error('Kiểm tra lại các ô báo đỏ')
      return
    }
    setErrors({})
    setPending(true)
    try {
      await api(`/api/weddings/${wedding.id}/story`, { method: 'PUT', body: parsed.data })
      setSaved(drafts)
      onSaved({ story: parsed.data.story })
      toast.success('Đã lưu chuyện tình')
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Không lưu được')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <p className="text-sm text-muted-foreground">
        Vài cột mốc của hai bạn: lần đầu gặp, lời cầu hôn… Không bắt buộc — để trống thì thiệp ẩn
        phần này.
      </p>

      <ol className="grid gap-4">
        {drafts.map((d, i) => {
          const err = (field: string) => errors[`story.${i}.${field}`]
          const id = (field: string) => `st-${d.key}-${field}`
          return (
            <li key={d.key} className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2">
              <Field id={id('date')} label="Mốc thời gian" error={err('date')}>
                <Input
                  id={id('date')}
                  value={d.date}
                  onChange={(e) => update(d.key, { date: e.target.value })}
                  placeholder="Mùa thu 2021"
                  aria-invalid={Boolean(err('date'))}
                />
              </Field>
              <Field id={id('title')} label="Tiêu đề" error={err('title')}>
                <Input
                  id={id('title')}
                  value={d.title}
                  onChange={(e) => update(d.key, { title: e.target.value })}
                  placeholder="Lần đầu gặp nhau"
                  aria-invalid={Boolean(err('title'))}
                />
              </Field>
              <Field id={id('text')} label="Kể ngắn" error={err('text')} className="sm:col-span-2">
                <Textarea
                  id={id('text')}
                  value={d.text}
                  onChange={(e) => update(d.key, { text: e.target.value })}
                  rows={3}
                  maxLength={600}
                  aria-invalid={Boolean(err('text'))}
                />
              </Field>
              <div className="flex justify-end gap-1 sm:col-span-2">
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
                  title="Xoá mục này"
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          )
        })}
      </ol>

      <div>
        <Button
          type="button"
          variant="outline"
          disabled={drafts.length >= LIMITS.storyItems}
          onClick={() =>
            setDrafts((list) => [...list, { key: newKey(), date: '', title: '', text: '' }])
          }
        >
          <Plus /> Thêm cột mốc
        </Button>
      </div>

      <SaveBar dirty={dirty} pending={pending} />
    </form>
  )
}
