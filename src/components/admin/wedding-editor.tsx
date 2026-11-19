'use client'

import { ExternalLink, Eye } from 'lucide-react'
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
import { PhonePreview, type PreviewSide } from './phone-preview'
import { StoryForm } from './story-form'
import { TemplateTab } from './template-tab'

const TABS = [
  { value: 'template', label: 'Mẫu thiệp' },
  { value: 'info', label: 'Thông tin' },
  { value: 'events', label: 'Sự kiện' },
  { value: 'media', label: 'Ảnh & nhạc' },
  { value: 'story', label: 'Chuyện tình' },
  { value: 'guests', label: 'Khách mời' },
  { value: 'feedback', label: 'Phản hồi' },
  { value: 'gifts', label: 'Mừng cưới' },
] as const

export function WeddingEditor({ initial }: { initial: WeddingDoc | null }) {
  const [wedding, setWedding] = useState<WeddingDoc>(initial ?? EMPTY_WEDDING)
  const [exists, setExists] = useState(initial !== null)
  const [version, setVersion] = useState(0)
  const [side, setSide] = useState<PreviewSide>('all')

  // Lưu vào Firestore, cập nhật dữ liệu đang sửa và tải lại khung xem trước
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
    setVersion((v) => v + 1)
  }

  // ?motion=full: luôn chạy hiệu ứng như trên điện thoại của khách, kể cả khi máy này tắt hiệu ứng
  const previewHref = `/?preview&motion=full${side === 'all' ? '' : `&side=${side}`}`

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="font-display text-4xl leading-tight tracking-tight">
            {wedding.groom.shortName}
            <span className="mx-2 text-primary italic">&amp;</span>
            {wedding.bride.shortName}
          </h1>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
            Mẫu {TEMPLATE_CATALOG[wedding.templateId].name}
          </span>
          <Button asChild variant="outline" size="sm" className="lg:hidden">
            <a href={previewHref} target="_blank" rel="noreferrer">
              <Eye /> Xem trước
            </a>
          </Button>
          <Button asChild variant="ghost" size="sm" className="ml-auto">
            <a href="/" target="_blank" rel="noreferrer">
              <ExternalLink /> Mở thiệp
            </a>
          </Button>
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
            <TabsContent value="story">
              <StoryForm wedding={wedding} onSave={onSave} />
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

      <aside className="hidden lg:block" aria-label="Xem trước thiệp">
        <div className="sticky top-20 pb-6">
          <PhonePreview
            src={previewHref}
            version={version}
            side={side}
            onSideChange={setSide}
            hasEvents={wedding.events.length > 0}
          />
        </div>
      </aside>
    </div>
  )
}
