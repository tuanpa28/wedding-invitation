'use client'

import { Check } from 'lucide-react'
import type { TemplateId } from '@/lib/invitation/types'
import { TEMPLATE_LIST } from '@/templates/catalog'

/** Chọn mẫu thiệp: mỗi mẫu là một tấm thiệp thu nhỏ theo đúng bảng màu của mẫu */
export function TemplatePicker({
  value,
  onChange,
}: {
  value: TemplateId
  onChange: (id: TemplateId) => void
}) {
  return (
    <div role="radiogroup" aria-label="Mẫu thiệp" className="grid gap-3 sm:grid-cols-3">
      {TEMPLATE_LIST.map((t) => {
        const selected = t.id === value
        const [bg, ink, accent] = t.swatch
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(t.id)}
            className="group relative flex flex-col overflow-hidden rounded-xl border bg-card text-left transition outline-none hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/40 aria-checked:border-primary aria-checked:ring-2 aria-checked:ring-primary/25"
          >
            <span
              aria-hidden
              className="relative grid h-28 place-items-center"
              style={{ background: bg, color: ink }}
            >
              <span className="font-display text-4xl" style={{ color: accent }}>
                {t.glyph}
              </span>
              <span
                className="absolute inset-x-6 bottom-4 h-px opacity-50"
                style={{ background: ink }}
              />
            </span>
            <span className="flex flex-1 flex-col gap-1 p-3">
              <span className="font-medium">{t.name}</span>
              <span className="text-xs/relaxed text-muted-foreground">{t.description}</span>
            </span>
            {selected && (
              <span className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-3.5" />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
