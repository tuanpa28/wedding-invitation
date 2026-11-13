'use client'

import { ArrowLeft, Eye } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { WeddingEditData } from '@/server/services/weddings'
import { StatusBadge } from '../status-badge'
import { EventsForm } from './events-form'
import { InfoForm } from './info-form'
import { MediaForm } from './media-form'
import { PhonePreview, type PreviewSide } from './phone-preview'
import { SharePanel } from './share-panel'
import { StoryForm } from './story-form'

const TABS = [
  { value: 'info', label: 'Thông tin' },
  { value: 'events', label: 'Sự kiện' },
  { value: 'media', label: 'Ảnh & nhạc' },
  { value: 'story', label: 'Chuyện tình' },
  { value: 'share', label: 'Gửi thiệp' },
] as const

export function WeddingEditor({
  initial,
  uploadsEnabled,
  currentUserId,
}: {
  initial: WeddingEditData
  uploadsEnabled: boolean
  currentUserId: string
}) {
  const [wedding, setWedding] = useState(initial)
  const [version, setVersion] = useState(0)
  const [side, setSide] = useState<PreviewSide>('all')

  // Sau mỗi lần lưu: cập nhật dữ liệu đang sửa và tải lại khung xem trước
  function onSaved(patch: Partial<WeddingEditData>) {
    setWedding((w) => ({ ...w, ...patch }))
    setVersion((v) => v + 1)
  }

  const previewHref = `/dashboard/${wedding.id}/preview${side === 'all' ? '' : `?side=${side}`}`

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
      <div className="min-w-0">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Thiệp của bạn
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="font-display text-4xl leading-tight tracking-tight">
            {wedding.groom.shortName}
            <span className="mx-2 text-primary italic">&amp;</span>
            {wedding.bride.shortName}
          </h1>
          <StatusBadge status={wedding.status} />
          <Button asChild variant="outline" size="sm" className="lg:hidden">
            <a href={previewHref} target="_blank" rel="noreferrer">
              <Eye /> Xem trước
            </a>
          </Button>
        </div>

        <Tabs defaultValue="info" className="mt-6">
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
            <TabsContent value="info">
              <InfoForm wedding={wedding} onSaved={onSaved} />
            </TabsContent>
            <TabsContent value="events">
              <EventsForm wedding={wedding} onSaved={onSaved} />
            </TabsContent>
            <TabsContent value="media" className="pb-10">
              <MediaForm wedding={wedding} uploadsEnabled={uploadsEnabled} onSaved={onSaved} />
            </TabsContent>
            <TabsContent value="story">
              <StoryForm wedding={wedding} onSaved={onSaved} />
            </TabsContent>
            <TabsContent value="share" className="pb-10">
              <SharePanel wedding={wedding} currentUserId={currentUserId} onSaved={onSaved} />
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
