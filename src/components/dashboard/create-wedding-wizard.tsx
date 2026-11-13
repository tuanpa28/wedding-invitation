'use client'

import { ArrowLeft, ArrowRight, Check, Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api, ApiError } from '@/lib/api-client'
import { suggestSlug } from '@/lib/invitation/slug'
import type { TemplateId } from '@/lib/invitation/types'
import { useOrigin } from '@/lib/use-origin'
import { createWeddingSchema, slugSchema } from '@/lib/validators/wedding'
import { TemplatePicker } from './template-picker'

const STEPS = ['Hai bạn', 'Đường dẫn', 'Mẫu thiệp'] as const

type SlugState =
  { kind: 'idle' } | { kind: 'checking' } | { kind: 'ok' } | { kind: 'error'; message: string }

export function CreateWeddingWizard() {
  const router = useRouter()
  const origin = useOrigin()
  const [step, setStep] = useState(0)
  const [groomName, setGroomName] = useState('')
  const [brideName, setBrideName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  // Kết quả kiểm tra gần nhất từ server, gắn với đúng slug đã hỏi
  const [checked, setChecked] = useState<{ slug: string; available: boolean; message?: string }>()
  const [templateId, setTemplateId] = useState<TemplateId>('song-hy')
  const [pending, setPending] = useState(false)

  // Gợi ý đường dẫn từ tên cho tới khi người dùng tự sửa
  const slugValue = slugTouched ? slug : suggestSlug(groomName, brideName)
  const parsedSlug = slugSchema.safeParse(slugValue)
  const validSlug = parsedSlug.success ? parsedSlug.data : null

  const slugState: SlugState = !parsedSlug.success
    ? slugValue
      ? { kind: 'error', message: parsedSlug.error.issues[0].message }
      : { kind: 'idle' }
    : checked?.slug !== validSlug
      ? { kind: 'checking' }
      : checked.available
        ? { kind: 'ok' }
        : { kind: 'error', message: checked.message ?? 'Đường dẫn này đã có người dùng' }

  // Hỏi server đường dẫn còn trống không (chờ người dùng ngừng gõ)
  useEffect(() => {
    if (step !== 1 || !validSlug) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/slugs/check?slug=${encodeURIComponent(validSlug)}`, {
          signal: controller.signal,
        })
        const data = (await res.json()) as { available: boolean; message?: string }
        setChecked({ slug: validSlug, ...data })
      } catch {
        // bị huỷ do người dùng gõ tiếp
      }
    }, 350)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [validSlug, step])

  const canNext =
    step === 0
      ? groomName.trim() !== '' && brideName.trim() !== ''
      : step === 1
        ? slugState.kind === 'ok'
        : true

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canNext) return
    if (step < STEPS.length - 1) {
      setStep(step + 1)
      return
    }
    const input = createWeddingSchema.safeParse({
      groomName,
      brideName,
      slug: slugValue,
      templateId,
    })
    if (!input.success) {
      toast.error(input.error.issues[0].message)
      return
    }
    setPending(true)
    try {
      const { wedding } = await api<{ wedding: { id: string } }>('/api/weddings', {
        body: input.data,
      })
      router.push(`/dashboard/${wedding.id}`)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Không tạo được thiệp')
      if (error instanceof ApiError && error.code === 'slug_taken') {
        setChecked({ slug: slugValue, available: false, message: error.message })
        setStep(1)
      }
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8">
      <div>
        <p className="text-sm text-muted-foreground">
          Bước {step + 1}/{STEPS.length}
        </p>
        <h1 className="mt-1 font-display text-4xl tracking-tight">
          {step === 0 && 'Tên hai bạn'}
          {step === 1 && 'Đường dẫn của thiệp'}
          {step === 2 && 'Chọn mẫu thiệp'}
        </h1>
        <ol className="mt-5 flex gap-2" aria-label="Các bước">
          {STEPS.map((label, i) => (
            <li
              key={label}
              aria-current={i === step ? 'step' : undefined}
              className="h-1 flex-1 rounded-full bg-border data-[done=true]:bg-primary"
              data-done={i <= step}
            >
              <span className="sr-only">{label}</span>
            </li>
          ))}
        </ol>
      </div>

      {step === 0 && (
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="groom">Chú rể</Label>
            <Input
              id="groom"
              value={groomName}
              onChange={(e) => setGroomName(e.target.value)}
              placeholder="Minh Tuấn"
              autoFocus
              maxLength={40}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bride">Cô dâu</Label>
            <Input
              id="bride"
              value={brideName}
              onChange={(e) => setBrideName(e.target.value)}
              placeholder="Ngọc Lan"
              maxLength={40}
            />
          </div>
          <p className="text-sm text-muted-foreground sm:col-span-2">
            Tên gọi in to trên thiệp. Họ tên đầy đủ và tên bố mẹ nhập ở bước sau.
          </p>
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-2">
          <Label htmlFor="slug">Đường dẫn</Label>
          <div className="flex items-center rounded-lg border bg-card focus-within:ring-3 focus-within:ring-ring/40">
            <span className="pl-3 font-mono text-sm text-muted-foreground select-none">
              {origin.replace(/^https?:\/\//, '')}/
            </span>
            <input
              id="slug"
              value={slugValue}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(e.target.value.toLowerCase())
              }}
              className="h-10 min-w-0 flex-1 bg-transparent pr-3 font-mono text-sm outline-none"
              autoFocus
              autoCapitalize="none"
              spellCheck={false}
              maxLength={60}
            />
          </div>
          <p
            className="flex items-center gap-1.5 text-sm data-[kind=error]:text-destructive data-[kind=ok]:text-gold"
            data-kind={slugState.kind}
            aria-live="polite"
          >
            {slugState.kind === 'checking' && (
              <>
                <Loader2 className="size-3.5 animate-spin" /> Đang kiểm tra…
              </>
            )}
            {slugState.kind === 'ok' && (
              <>
                <Check className="size-3.5" /> Dùng được
              </>
            )}
            {slugState.kind === 'error' && (
              <>
                <X className="size-3.5" /> {slugState.message}
              </>
            )}
            {slugState.kind === 'idle' && 'Chữ thường không dấu, số và dấu gạch ngang.'}
          </p>
          <p className="text-sm text-muted-foreground">
            Mỗi khách sẽ có link riêng dạng{' '}
            <span className="font-mono">/{slugValue || 'ten-ban'}/ma-khach</span>. Có thể đổi trước
            khi gửi thiệp.
          </p>
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-3">
          <TemplatePicker value={templateId} onChange={setTemplateId} />
          <p className="text-sm text-muted-foreground">Đổi mẫu lúc nào cũng được.</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t pt-6">
        {step > 0 ? (
          <Button type="button" variant="ghost" onClick={() => setStep(step - 1)}>
            <ArrowLeft /> Quay lại
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" disabled={!canNext || pending}>
          {step < STEPS.length - 1 ? (
            <>
              Tiếp <ArrowRight />
            </>
          ) : pending ? (
            <>
              <Loader2 className="animate-spin" /> Đang tạo…
            </>
          ) : (
            'Tạo thiệp'
          )}
        </Button>
      </div>
    </form>
  )
}
