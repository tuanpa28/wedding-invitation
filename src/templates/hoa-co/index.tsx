import { Leaf } from 'lucide-react'
import { Dancing_Script, Quicksand } from 'next/font/google'
import Image from 'next/image'
import type { CSSProperties, ReactNode } from 'react'
import { Album } from '@/components/invitation/album'
import { Countdown } from '@/components/invitation/countdown'
import { EventActions } from '@/components/invitation/event-actions'
import {
  CoverOverlay,
  InvitationShell,
  OpenInvitationButton,
} from '@/components/invitation/invitation-shell'
import { Reveal } from '@/components/invitation/reveal'
import {
  eventDateParts,
  groupEventsBySide,
  inviteeInSentence,
  inviteeName,
  SIDE_LABEL,
} from '@/lib/invitation/helpers'
import type { WeddingEvent } from '@/lib/invitation/types'
import { cn } from '@/lib/utils'
import type { TemplateProps } from '../types'

// Hoa Cỏ — pastel đồng quê: xanh lá xám, hồng phấn, tím bằng lăng.
// Điểm nhấn: cành hoa dại vẽ nét, tự "mọc" khi cuộn tới.

const script = Dancing_Script({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-hc-script',
  display: 'swap',
  preload: false,
})

const rounded = Quicksand({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-hc-body',
  display: 'swap',
  preload: false,
})

const palette = {
  '--hc-bg': '#f1f4ea',
  '--hc-card': '#fbfcf7',
  '--hc-leaf': '#4a5e42',
  '--hc-sage': '#91a584',
  // Màu chữ phụ: đủ tương phản (≥ 4.5:1) trên nền --hc-bg
  '--hc-moss': '#586c50',
  '--hc-blush': '#e8c3bb',
  '--hc-blush-deep': '#d9a89e',
  '--hc-lilac': '#b4a2cf',
  '--hc-butter': '#f0d89d',
  '--hc-ink': '#36412f',
} as CSSProperties

export default function HoaCoTemplate({
  invitation,
  guest,
  events,
  featured,
  couple,
  calendarCouple,
}: TemplateProps) {
  const date = eventDateParts(featured.startAt)
  const groups = guest ? null : groupEventsBySide(events)

  return (
    <InvitationShell
      musicUrl={invitation.musicUrl}
      style={palette}
      className={cn(
        script.variable,
        rounded.variable,
        'min-h-svh overflow-x-clip bg-(--hc-bg) font-(family-name:--font-hc-body) font-medium text-(--hc-ink) antialiased',
      )}
      musicButtonClassName="bg-(--hc-leaf) text-(--hc-card) focus-visible:ring-(--hc-lilac)"
    >
      {/* ---------- Phong bì có con dấu sáp ---------- */}
      <CoverOverlay className="bg-(--hc-bg) transition-opacity delay-500 duration-700 group-data-[phase=opening]/inv:opacity-0 motion-reduce:transition-none">
        <div className="flex h-full flex-col items-center justify-center gap-10 px-6 text-center">
          <div>
            <p className="text-sm tracking-[0.3em] text-(--hc-moss) uppercase">Gửi tới</p>
            <p className="mt-2 font-(family-name:--font-hc-script) text-5xl leading-[1.25] text-(--hc-leaf)">
              {inviteeName(guest)}
            </p>
          </div>

          <div className="relative aspect-[3/2] w-[min(80vw,340px)] [perspective:900px]">
            <div className="absolute inset-0 rounded-lg bg-(--hc-blush) shadow-[0_18px_40px_-20px_rgba(74,94,66,0.55)]" />
            {/* Hai vạt bên + vạt dưới */}
            <div className="absolute inset-0 rounded-lg bg-(--hc-blush-deep)/45 [clip-path:polygon(0_0,50%_55%,0_100%)]" />
            <div className="absolute inset-0 rounded-lg bg-(--hc-blush-deep)/45 [clip-path:polygon(100%_0,50%_55%,100%_100%)]" />
            <div className="absolute inset-0 rounded-lg bg-(--hc-blush-deep)/25 [clip-path:polygon(0_100%,50%_50%,100%_100%)]" />
            {/* Vạt trên — lật lên khi mở */}
            <div className="absolute inset-x-0 top-0 z-10 h-[58%] origin-top rounded-t-lg bg-(--hc-blush-deep) transition-transform duration-700 ease-out [clip-path:polygon(0_0,100%_0,50%_100%)] group-data-[phase=opening]/inv:[transform:rotateX(180deg)] motion-reduce:transition-none" />
            <OpenInvitationButton className="absolute top-[58%] left-1/2 z-20 grid size-[4.5rem] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-(--hc-lilac) text-(--hc-card) shadow-[inset_0_-4px_0_rgba(0,0,0,0.12),0_6px_14px_-6px_rgba(54,65,47,0.6)] transition group-data-[phase=opening]/inv:scale-0 hover:scale-105 focus-visible:ring-2 focus-visible:ring-(--hc-leaf) focus-visible:ring-offset-4 focus-visible:ring-offset-(--hc-bg) focus-visible:outline-none motion-reduce:transition-none">
              <Leaf className="size-7" aria-hidden />
              <span className="sr-only">Mở thiệp</span>
            </OpenInvitationButton>
          </div>

          <p className="text-sm text-(--hc-ink)/80">Chạm vào con dấu để mở thiệp</p>
        </div>
      </CoverOverlay>

      {/* ---------- Đầu thiệp ---------- */}
      <Reveal plain as="header" className="group/grow relative px-6 pt-16 pb-14 text-center">
        <Sprig className="absolute top-28 -left-7 h-48 w-24 -scale-x-100" />
        <Sprig className="absolute top-28 -right-7 h-48 w-24" />
        <p className="text-xs tracking-[0.35em] text-(--hc-moss) uppercase">Ngày chung đôi</p>
        <h1 className="relative mt-5 font-(family-name:--font-hc-script) text-6xl leading-[1.2] text-(--hc-leaf)">
          {couple[0].shortName}
          <span className="block text-4xl text-(--hc-lilac)">&amp;</span>
          {couple[1].shortName}
        </h1>

        <div className="relative mx-auto mt-10 aspect-[3/4] w-56 overflow-hidden rounded-[50%] border-[6px] border-(--hc-card) shadow-[0_20px_40px_-24px_rgba(74,94,66,0.7)]">
          <Image
            src={invitation.cover.src}
            alt={invitation.cover.alt}
            fill
            loading="eager"
            fetchPriority="high"
            sizes="224px"
            className="object-cover"
          />
        </div>

        <div className="mx-auto mt-10 grid max-w-xs grid-cols-3 items-center text-sm">
          <span>{date.weekday}</span>
          <span className="border-x border-(--hc-sage)/60 py-2 text-2xl font-semibold text-(--hc-leaf)">
            {date.day}.{date.month}
          </span>
          <span>{date.time}</span>
        </div>
        <p className="mt-2 text-sm">năm {date.year}</p>
        {featured.lunarText && (
          <p className="mt-1 text-xs text-(--hc-ink)/80">{featured.lunarText}</p>
        )}
      </Reveal>

      <main className="mx-auto max-w-md space-y-8 px-5 pb-16">
        {/* ---------- Lời mời ---------- */}
        <Card>
          <Heading>Thư mời</Heading>
          <p className="mt-5 leading-relaxed">
            Trân trọng kính mời{' '}
            <span className="font-semibold text-(--hc-leaf)">{inviteeInSentence(guest)}</span> tới
            chung vui trong ngày trọng đại của chúng mình.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 text-sm leading-relaxed">
            {couple.map((person) => (
              <div key={person.fullName} className="rounded-2xl bg-(--hc-bg) px-3 py-4">
                <p className="text-xs tracking-[0.25em] text-(--hc-moss) uppercase">
                  {SIDE_LABEL[person === invitation.groom ? 'groom' : 'bride']}
                </p>
                {person.father && <p className="mt-2">{person.father}</p>}
                {person.mother && <p>{person.mother}</p>}
                <p className="mt-3 text-xs text-(--hc-ink)/80">{person.title}</p>
                <p className="font-(family-name:--font-hc-script) text-2xl leading-snug text-(--hc-leaf)">
                  {person.fullName}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* ---------- Đếm ngược ---------- */}
        <Card>
          <Heading>Đếm từng ngày</Heading>
          <Countdown
            target={featured.startAt}
            className="mt-6 gap-2"
            itemClassName="aspect-square justify-center rounded-full bg-(--hc-blush)/45"
            numberClassName="text-2xl font-semibold text-(--hc-leaf)"
            labelClassName="text-[0.7rem] text-(--hc-ink)/80"
          />
        </Card>

        {/* ---------- Sự kiện ---------- */}
        <section>
          <Heading className="mb-6 pt-4">Lễ cưới</Heading>
          {groups ? (
            groups.map((group) => (
              <div key={group.side} className="mt-6 first:mt-0">
                <p className="mb-3 text-center text-xs tracking-[0.3em] text-(--hc-moss) uppercase">
                  {group.label}
                </p>
                <div className="space-y-4">
                  {group.events.map((event) => (
                    <EventCard key={event.id} event={event} calendarCouple={calendarCouple} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <EventCard key={event.id} event={event} calendarCouple={calendarCouple} />
              ))}
            </div>
          )}
        </section>

        {/* ---------- Chuyện tình ---------- */}
        {invitation.story.length > 0 && (
          <section>
            <Heading className="mb-6 pt-4">Chuyện tình mình</Heading>
            <div className="space-y-10">
              {invitation.story.map((item, i) => (
                <Reveal key={item.title} className="text-center">
                  {item.photo && (
                    <Image
                      src={item.photo.src}
                      width={item.photo.width}
                      height={item.photo.height}
                      alt={item.photo.alt}
                      sizes="(min-width: 448px) 400px, 90vw"
                      className={cn(
                        'h-auto w-full rounded-[2rem] border-[5px] border-(--hc-card) shadow-sm',
                        i % 2 === 0 ? '-rotate-1' : 'rotate-1',
                      )}
                    />
                  )}
                  <p className="mt-5 text-xs tracking-[0.25em] text-(--hc-moss) uppercase">
                    {item.date}
                  </p>
                  <h3 className="mt-1 font-(family-name:--font-hc-script) text-3xl text-(--hc-leaf)">
                    {item.title}
                  </h3>
                  <p className="mx-auto mt-2 max-w-sm leading-relaxed">{item.text}</p>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {/* ---------- Album ---------- */}
        {invitation.gallery.length > 0 && (
          <section>
            <Heading className="mb-6 pt-4">Khoảnh khắc</Heading>
            <Album
              photos={invitation.gallery}
              itemClassName="overflow-hidden rounded-2xl"
              imageClassName="rounded-2xl"
            />
          </section>
        )}
      </main>

      {/* ---------- Lời cảm ơn ---------- */}
      <Reveal
        plain
        as="footer"
        className="group/grow relative overflow-hidden px-6 pt-10 pb-24 text-center"
      >
        <Sprig className="absolute bottom-6 left-1/2 h-40 w-20 -translate-x-[150%] -scale-x-100" />
        <Sprig className="absolute bottom-6 left-1/2 h-40 w-20 translate-x-1/2" />
        <p className="relative font-(family-name:--font-hc-script) text-4xl leading-snug text-(--hc-leaf)">
          Hẹn gặp {inviteeInSentence(guest)}
          <br />
          trong ngày vui!
        </p>
        <p className="relative mt-4 text-sm">
          {couple[0].shortName} &amp; {couple[1].shortName}
        </p>
        <p className="relative mt-12 text-[0.7rem] tracking-[0.3em] text-(--hc-moss) uppercase">
          Thiệp Hồng
        </p>
      </Reveal>
    </InvitationShell>
  )
}

/* ---------------------------------------------------------------- */

function Card({ children }: { children: ReactNode }) {
  return (
    <Reveal
      as="section"
      className="rounded-[2rem] bg-(--hc-card) px-6 py-8 text-center shadow-[0_14px_34px_-22px_rgba(74,94,66,0.45)]"
    >
      {children}
    </Reveal>
  )
}

function Heading({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2
      className={cn(
        'flex items-center justify-center gap-3 font-(family-name:--font-hc-script) text-4xl text-(--hc-leaf)',
        className,
      )}
    >
      <Leaf className="size-4 -scale-x-100 text-(--hc-moss)" aria-hidden />
      {children}
      <Leaf className="size-4 text-(--hc-moss)" aria-hidden />
    </h2>
  )
}

function EventCard({
  event,
  calendarCouple,
}: {
  event: WeddingEvent
  calendarCouple: TemplateProps['calendarCouple']
}) {
  const d = eventDateParts(event.startAt)
  return (
    <Reveal className="rounded-[2rem] bg-(--hc-card) px-6 py-7 text-center shadow-[0_14px_34px_-22px_rgba(74,94,66,0.45)]">
      <h3 className="font-(family-name:--font-hc-script) text-3xl text-(--hc-leaf)">
        {event.title}
      </h3>
      <p className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full bg-(--hc-blush)/45 px-4 py-1.5 text-sm">
        <span className="font-semibold">{d.time}</span>
        <span aria-hidden>·</span>
        <span>
          {d.weekday}, {d.date}
        </span>
      </p>
      {event.lunarText && <p className="mt-2 text-xs text-(--hc-ink)/80">{event.lunarText}</p>}
      <p className="mt-4 text-base font-semibold">{event.venue}</p>
      <p className="mt-1 text-sm leading-relaxed text-(--hc-ink)/80">{event.address}</p>
      <EventActions
        event={event}
        couple={calendarCouple}
        className="mt-5 justify-center"
        buttonClassName="rounded-full bg-(--hc-leaf) font-semibold text-(--hc-card) hover:bg-(--hc-ink) focus-visible:ring-(--hc-leaf)"
      />
    </Reveal>
  )
}

/** Cành hoa dại: nét thân/lá tự vẽ ra khi phần tử cha (group/grow) có data-shown */
function Sprig({ className }: { className?: string }) {
  const draw =
    '[stroke-dasharray:1] [stroke-dashoffset:1] transition-[stroke-dashoffset] duration-[1800ms] ease-out group-data-shown/grow:[stroke-dashoffset:0] motion-reduce:[stroke-dashoffset:0] motion-reduce:transition-none'
  const bloom =
    'origin-center scale-0 opacity-0 transition duration-700 [transform-box:fill-box] group-data-shown/grow:scale-100 group-data-shown/grow:opacity-100 motion-reduce:scale-100 motion-reduce:opacity-100 motion-reduce:transition-none'

  return (
    <svg
      viewBox="0 0 80 160"
      aria-hidden
      className={cn('pointer-events-none overflow-visible', className)}
    >
      <g fill="none" stroke="var(--hc-leaf)" strokeWidth="1.3" strokeLinecap="round">
        <path
          pathLength={1}
          className={draw}
          d="M40 158 C 37 122, 47 92, 39 58 C 35 40, 40 24, 45 10"
        />
        <path pathLength={1} className={draw} d="M40 104 C 50 99, 57 90, 59 80" />
        <path pathLength={1} className={draw} d="M38 70 C 31 62, 27 52, 26 44" />
        <path
          pathLength={1}
          className={cn(draw, 'fill-(--hc-sage)/25')}
          d="M39 128 C 26 122, 19 110, 17 101 C 29 105, 36 114, 39 128 Z"
        />
        <path
          pathLength={1}
          className={cn(draw, 'fill-(--hc-sage)/25')}
          d="M41 94 C 52 90, 58 80, 61 72 C 51 75, 44 83, 41 94 Z"
        />
        <path
          pathLength={1}
          className={cn(draw, 'fill-(--hc-sage)/25')}
          d="M39 50 C 47 46, 52 38, 53 31 C 45 34, 40 41, 39 50 Z"
        />
      </g>
      <Flower cx={45} cy={9} petal="var(--hc-blush-deep)" className={cn(bloom, 'delay-[1200ms]')} />
      <Flower cx={60} cy={78} petal="var(--hc-lilac)" className={cn(bloom, 'delay-[1500ms]')} />
      <Flower cx={25} cy={42} petal="var(--hc-blush)" className={cn(bloom, 'delay-[1700ms]')} />
    </svg>
  )
}

function Flower({
  cx,
  cy,
  petal,
  className,
}: {
  cx: number
  cy: number
  petal: string
  className?: string
}) {
  const petals = [0, 72, 144, 216, 288]
  return (
    <g className={className}>
      {petals.map((deg) => {
        const rad = (deg * Math.PI) / 180
        return (
          <circle
            key={deg}
            cx={cx + Math.sin(rad) * 4.2}
            cy={cy - Math.cos(rad) * 4.2}
            r={3.6}
            fill={petal}
          />
        )
      })}
      <circle cx={cx} cy={cy} r={2.4} fill="var(--hc-butter)" />
    </g>
  )
}
