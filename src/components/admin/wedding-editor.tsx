'use client'

import { ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EMPTY_WEDDING, saveWedding } from '@/lib/firebase/admin-client'
import type { WeddingDoc } from '@/lib/invitation/types'
import { TEMPLATE_CATALOG } from '@/templates/catalog'
import type { WeddingPatch } from './editor-types'
import { EventsForm } from './events-form'
import { FeedbackTab } from './feedback/feedback-tab'
import { GiftsTab } from './gifts-tab'
import { GuestsTab } from './guests/guests-tab'
import { InfoForm } from './info-form'
import { MediaForm } from './media-form'
import { TemplateTab } from './template-tab'

const TABS = [
  { value: 'template', label: 'Mẫu thiệp' },
  { value: 'info', label: 'Thông tin' },
  { value: 'events', label: 'Sự kiện' },
  { value: 'media', label: 'Ảnh & nhạc' },
  { value: 'guests', label: 'Khách mời' },
  { value: 'feedback', label: 'Phản hồi' },
  { value: 'gifts', label: 'Mừng cưới' },
] as const

// Mở thiệp ở tab mới để xem như khách. ?motion=full: luôn chạy hiệu ứng (kể cả khi máy này tắt
// hiệu ứng); ?preview: không tính là lượt mở của khách.
const PREVIEWS = [
  { href: '/?preview&motion=full', label: 'Link chung' },
  { href: '/?preview&motion=full&side=groom', label: 'Như khách nhà trai' },
  { href: '/?preview&motion=full&side=bride', label: 'Như khách nhà gái' },
] as const

export function WeddingEditor({ initial }: { initial: WeddingDoc | null }) {
  const [wedding, setWedding] = useState<WeddingDoc>(initial ?? EMPTY_WEDDING)
  const [exists, setExists] = useState(initial !== null)

  // Lưu vào Firestore rồi cập nhật dữ liệu đang sửa
  async function onSave(patch: WeddingPatch) {
    await saveWedding(patch, exists)
    setExists(true)
    setWedding((w) => {
      const next = { ...w } as Record<string, unknown>
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === undefined) delete next[key]
        else next[key] = value
      }
      return next as WeddingDoc
    })
  }

  const templateName = TEMPLATE_CATALOG[wedding.templateId]?.name ?? 'Song Hỷ'

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="font-display text-4xl leading-tight tracking-tight">
          {wedding.groom.shortName}
          <span className="mx-2 text-primary italic">&amp;</span>
          {wedding.bride.shortName}
        </h1>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
          Mẫu {templateName}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Xem thiệp:</span>
        {PREVIEWS.map((p) => (
          <Button key={p.href} asChild variant="outline" size="sm">
            <a href={p.href} target="_blank" rel="noreferrer">
              <ExternalLink /> {p.label}
            </a>
          </Button>
        ))}
      </div>

      {!exists && (
        <p className="mt-4 rounded-xl border border-dashed bg-card p-4 text-sm text-muted-foreground">
          Thiệp chưa có nội dung. Nhập thông tin hai bên và ít nhất một sự kiện rồi lưu — khách mở
          link sẽ thấy thiệp ngay.
        </p>
      )}

      <Tabs defaultValue="template" className="mt-6">
        <div className="-mx-4 [scrollbar-width:none] overflow-x-auto px-4">
          <TabsList variant="line" className="h-10! border-b-0">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="px-3">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <div className="pt-6">
          <TabsContent value="template" className="pb-10">
            <TemplateTab wedding={wedding} onSave={onSave} />
          </TabsContent>
          <TabsContent value="info">
            <InfoForm wedding={wedding} onSave={onSave} />
          </TabsContent>
          <TabsContent value="events">
            <EventsForm wedding={wedding} onSave={onSave} />
          </TabsContent>
          <TabsContent value="media" className="pb-10">
            <MediaForm wedding={wedding} onSave={onSave} />
          </TabsContent>
          <TabsContent value="guests">
            <GuestsTab wedding={wedding} onSave={onSave} />
          </TabsContent>
          <TabsContent value="feedback">
            <FeedbackTab wedding={wedding} onSave={onSave} />
          </TabsContent>
          <TabsContent value="gifts">
            <GiftsTab wedding={wedding} onSave={onSave} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
