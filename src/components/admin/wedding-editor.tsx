'use client'

import {
  CalendarDays,
  ExternalLink,
  Gift,
  LayoutDashboard,
  MessageCircleHeart,
  Palette,
  RefreshCw,
  Send,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { Fragment, useEffect, useState } from 'react'
import { EMPTY_WEDDING, saveWedding } from '@/lib/firebase/admin-client'
import type { WeddingDoc } from '@/lib/invitation/types'
import { staleParts, type PrerenderStamp } from '@/lib/prerender'
import { cn } from '@/lib/utils'
import { TEMPLATE_CATALOG } from '@/templates/catalog'
import { AdminDataProvider, useAdminData } from './admin-data'
import { AdminsTab } from './admins-tab'
import { DesignTab } from './design-tab'
import { DirtyProvider, DirtySection, sectionOf, useDirtyTracker } from './dirty'
import type { EditorFormProps, WeddingPatch } from './editor-types'
import { EventsForm } from './events-form'
import { FeedbackTab } from './feedback/feedback-tab'
import { GiftsTab } from './gifts-tab'
import { GuestsTab } from './guests/guests-tab'
import { InfoForm } from './info-form'
import { OverviewTab } from './overview-tab'

export type TabId =
  'overview' | 'info' | 'events' | 'design' | 'gifts' | 'guests' | 'feedback' | 'admins'

type TabDef = {
  id: TabId
  group: TabGroup
  label: string
  icon: LucideIcon
  Panel: (props: EditorFormProps & { goTo: (tab: TabId) => void }) => React.ReactNode
}

// Menu theo đúng thứ tự công việc: làm thiệp xong rồi mới gửi và theo dõi
type TabGroup = '' | 'Chuẩn bị thiệp' | 'Gửi & theo dõi' | 'Cài đặt'

const TABS: TabDef[] = [
  { id: 'overview', group: '', label: 'Tổng quan', icon: LayoutDashboard, Panel: OverviewTab },
  { id: 'info', group: 'Chuẩn bị thiệp', label: 'Thông tin', icon: UserRound, Panel: InfoForm },
  {
    id: 'events',
    group: 'Chuẩn bị thiệp',
    label: 'Sự kiện',
    icon: CalendarDays,
    Panel: EventsForm,
  },
  { id: 'design', group: 'Chuẩn bị thiệp', label: 'Giao diện', icon: Palette, Panel: DesignTab },
  { id: 'gifts', group: 'Chuẩn bị thiệp', label: 'Mừng cưới', icon: Gift, Panel: GiftsTab },
  { id: 'guests', group: 'Gửi & theo dõi', label: 'Khách mời', icon: Send, Panel: GuestsTab },
  {
    id: 'feedback',
    group: 'Gửi & theo dõi',
    label: 'Phản hồi',
    icon: MessageCircleHeart,
    Panel: FeedbackTab,
  },
  { id: 'admins', group: 'Cài đặt', label: 'Người quản lý', icon: ShieldCheck, Panel: AdminsTab },
]

/** Link cũ trước khi gộp tab (#template, #media) vẫn mở đúng chỗ */
const LEGACY: Record<string, TabId> = { template: 'design', media: 'design' }

const isTab = (value: string): value is TabId => TABS.some((t) => t.id === value)
const tabFromHash = () => {
  const raw = window.location.hash.slice(1)
  const hash = LEGACY[raw] ?? raw
  return isTab(hash) ? hash : 'overview'
}

// Mở thiệp ở tab mới để xem như khách. ?motion=full: luôn chạy hiệu ứng (kể cả khi máy này tắt
// hiệu ứng); ?preview: không tính là lượt mở của khách.
export const PREVIEWS = [
  { href: '/?preview&motion=full', label: 'Link chung' },
  { href: '/?preview&motion=full&side=groom', label: 'Khách nhà trai' },
  { href: '/?preview&motion=full&side=bride', label: 'Khách nhà gái' },
] as const

type EditorProps = { initial: WeddingDoc | null; built: PrerenderStamp | null }

export function WeddingEditor(props: EditorProps) {
  return (
    <AdminDataProvider>
      <Editor {...props} />
    </AdminDataProvider>
  )
}

function Editor({ initial, built }: EditorProps) {
  const [wedding, setWedding] = useState<WeddingDoc>(initial ?? EMPTY_WEDDING)
  const [exists, setExists] = useState(initial !== null)
  const [tab, setTab] = useState<TabId>(tabFromHash)
  const { dirty, report } = useDirtyTracker()
  const dirtyTabs = new Set([...dirty].map(sectionOf))

  // Tab nằm trên URL (#guests…): tải lại trang hay bấm Back vẫn đúng chỗ
  useEffect(() => {
    const onHash = () => setTab(tabFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  function goTo(next: TabId) {
    if (next !== tab) window.history.pushState(null, '', `#${next}`)
    setTab(next)
    window.scrollTo({ top: 0 })
  }

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
  const stale = built && exists ? staleParts(built, wedding) : []
  const current = TABS.find((t) => t.id === tab) ?? TABS[0]

  return (
    <DirtyProvider report={report}>
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 lg:grid lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-10">
        {/* Màn hình nhỏ: `contents` để menu dính được theo cả trang, không chỉ trong aside */}
        <aside className="max-lg:contents lg:sticky lg:top-20 lg:self-start">
          <div className="lg:mb-6">
            <p className="font-display text-3xl leading-tight tracking-tight lg:text-2xl">
              {wedding.groom.shortName}
              <span className="mx-1.5 text-primary italic">&amp;</span>
              {wedding.bride.shortName}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Mẫu {templateName}</p>
          </div>

          <Nav current={current.id} dirtyTabs={dirtyTabs} onSelect={goTo} />

          <div className="mt-8 hidden gap-1 lg:grid">
            <p className="mb-1 px-3 text-xs font-medium text-muted-foreground">Xem thiệp như</p>
            {PREVIEWS.map((p) => (
              <a
                key={p.href}
                href={p.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <ExternalLink className="size-3.5" /> {p.label}
              </a>
            ))}
          </div>
        </aside>

        <div className="min-w-0 pt-6 lg:pt-0">
          {!exists && (
            <p className="mb-6 rounded-xl border border-dashed bg-card p-4 text-sm text-muted-foreground">
              Thiệp chưa có nội dung. Nhập thông tin hai bên và ít nhất một sự kiện rồi lưu, khách
              mở link là thấy thiệp ngay.
            </p>
          )}
          <h1 className="mb-6 font-display text-3xl tracking-tight max-lg:sr-only">
            {current.label}
          </h1>
          {stale.length > 0 && (
            <div
              role="status"
              className="mb-6 flex gap-3 rounded-xl border border-gold/40 bg-gold-soft/50 p-4 text-sm"
            >
              <RefreshCw className="mt-0.5 size-4 shrink-0 text-gold" />
              <p>
                <span className="font-medium">Nên deploy lại thiệp.</span> Bạn đã đổi{' '}
                {stale.join(', ')} so với bản deploy gần nhất. Khách vẫn thấy nội dung mới, nhưng
                khoảnh khắc vừa mở link
                {stale.some((p) => p !== 'mẫu thiệp') &&
                  ' và ảnh xem trước khi chia sẻ lên Zalo'}{' '}
                vẫn là bản cũ. Chạy{' '}
                <code className="rounded bg-background px-1 font-mono text-xs">npm run deploy</code>{' '}
                để cập nhật.
              </p>
            </div>
          )}
          {/* Mọi tab luôn nằm trong trang (chỉ ẩn), nên đổi tab không mất phần đang sửa */}
          {TABS.map(({ id, Panel }) => (
            <section
              key={id}
              hidden={id !== current.id}
              aria-label={TABS.find((t) => t.id === id)?.label}
            >
              <DirtySection name={id}>
                <Panel wedding={wedding} onSave={onSave} goTo={goTo} />
              </DirtySection>
            </section>
          ))}
        </div>
      </div>
    </DirtyProvider>
  )
}

function Nav({
  current,
  dirtyTabs,
  onSelect,
}: {
  current: TabId
  dirtyTabs: ReadonlySet<string>
  onSelect: (tab: TabId) => void
}) {
  const { guests, rsvps, wishes } = useAdminData()
  const counts: Partial<Record<TabId, number | undefined>> = {
    guests: guests?.length,
    feedback: rsvps && wishes ? rsvps.length + wishes.length : undefined,
  }

  return (
    <nav
      aria-label="Mục quản lý"
      className="sticky top-14 z-20 -mx-4 mt-4 border-b bg-background/90 px-4 backdrop-blur lg:static lg:mx-0 lg:mt-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none"
    >
      <ul className="relative flex [scrollbar-width:none] gap-1 overflow-x-auto py-2 lg:flex-col lg:overflow-visible lg:py-0">
        {TABS.map(({ id, group, label, icon: Icon }, i) => {
          const active = id === current
          const startsGroup = group !== '' && TABS[i - 1]?.group !== group
          return (
            <Fragment key={id}>
              {startsGroup && (
                <li
                  role="presentation"
                  className="flex shrink-0 items-center max-lg:px-1 lg:mt-5 lg:mb-1 lg:px-3"
                >
                  <span aria-hidden className="h-5 w-px bg-border lg:hidden" />
                  <span className="text-xs font-medium text-muted-foreground max-lg:sr-only">
                    {group}
                  </span>
                </li>
              )}
              <li className="shrink-0">
                <button
                  type="button"
                  onClick={() => onSelect(id)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm whitespace-nowrap transition outline-none focus-visible:ring-3 focus-visible:ring-ring/40',
                    active
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="lg:flex-1 lg:text-left">{label}</span>
                  {dirtyTabs.has(id) ? (
                    <span className="size-2 rounded-full bg-primary" title="Có thay đổi chưa lưu">
                      <span className="sr-only">(có thay đổi chưa lưu)</span>
                    </span>
                  ) : counts[id] !== undefined ? (
                    <span className="text-xs text-muted-foreground tabular-nums">{counts[id]}</span>
                  ) : null}
                </button>
              </li>
            </Fragment>
          )
        })}
      </ul>
    </nav>
  )
}
