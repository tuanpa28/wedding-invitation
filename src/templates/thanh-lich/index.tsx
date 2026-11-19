import { ArrowRight } from 'lucide-react'
import { Be_Vietnam_Pro, Fraunces } from 'next/font/google'
import { WeddingImage as Image } from '@/components/invitation/wedding-image'
import type { CSSProperties, ReactNode } from 'react'
import { Album } from '@/components/invitation/album'
import { Countdown } from '@/components/invitation/countdown'
import { EventActions } from '@/components/invitation/event-actions'
import { RsvpForm } from '@/components/invitation/feedback/rsvp-form'
import { feedbackTheme } from '@/components/invitation/feedback/styles'
import { WishesBoard } from '@/components/invitation/feedback/wishes-board'
import { rsvpState } from '@/lib/feedback'
import {
  CoverOverlay,
  InvitationShell,
  OpenInvitationButton,
} from '@/components/invitation/invitation-shell'
import {
  CurtainReveal,
  GrowLine,
  HeroItem,
  MaskLine,
  ParallaxImage,
} from '@/components/invitation/motion'
import { Reveal } from '@/components/invitation/reveal'
import {
  eventDateParts,
  groupEventsBySide,
  inviteeInSentence,
  inviteeName,
  monthGrid,
  SIDE_LABEL,
} from '@/lib/invitation/helpers'
import type { Person, WeddingEvent } from '@/lib/invitation/types'
import { cn } from '@/lib/utils'
import type { TemplateProps } from '../types'

// Thanh Lịch — tối giản lạnh: mực navy, giấy trắng, xám sương.
// Điểm nhấn: tờ lịch tháng cưới, ngày cưới được khoanh bằng nét bút tay.
// Chuyển động tiết chế kiểu tạp chí: chữ trồi lên sau mặt nạ, ảnh mở như rèm, đường kẻ tự kéo dài.

const sans = Be_Vietnam_Pro({
  weight: ['300', '400', '500', '600'],
  subsets: ['latin', 'vietnamese'],
  variable: '--font-tl-sans',
  display: 'swap',
  preload: false,
})

const serif = Fraunces({
  subsets: ['latin', 'vietnamese'],
  style: ['normal', 'italic'],
  variable: '--font-tl-serif',
  display: 'swap',
  preload: false,
})

const palette = {
  '--tl-ink': '#1c2430',
  '--tl-paper': '#f7f7f3',
  '--tl-mist': '#dfe3e4',
  '--tl-slate': '#5f6c78',
  '--tl-blue': '#2f5578',
} as CSSProperties

// Form RSVP / sổ lưu bút: tối giản, nút mực, góc vuông
const feedback = feedbackTheme({
  accent: 'var(--tl-ink)',
  onAccent: 'var(--tl-paper)',
  ink: 'var(--tl-ink)',
  muted: 'var(--tl-slate)',
  card: '#ffffff',
  line: 'var(--tl-mist)',
  radius: '0px',
})

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

export default function ThanhLichTemplate({
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
      openDuration={1300}
      style={palette}
      className={cn(
        sans.variable,
        serif.variable,
        'min-h-svh bg-(--tl-paper) font-(family-name:--font-tl-sans) font-light text-(--tl-ink) antialiased',
      )}
      musicButtonClassName="bg-(--tl-ink) text-(--tl-paper) focus-visible:ring-(--tl-blue)"
    >
      {/* ---------- Phong bì: tấm thiệp trắng kéo lên ---------- */}
      <CoverOverlay className="bg-(--tl-paper) transition-transform duration-[1200ms] ease-[cubic-bezier(0.7,0,0.2,1)] group-data-[phase=opening]/inv:-translate-y-full motion-reduce:transition-none">
        <div className="mx-auto flex h-full max-w-md flex-col justify-between px-8 py-[10svh]">
          <p className="text-[0.7rem] font-medium tracking-[0.45em] text-(--tl-slate) uppercase">
            Thiệp mời
          </p>
          <div>
            <p className="text-sm text-(--tl-slate)">Gửi</p>
            <MaskLine
              onOpen={false}
              delay={0.2}
              className="mt-2 font-(family-name:--font-tl-serif) text-[2.6rem] leading-[1.15] italic"
            >
              {inviteeName(guest)}
            </MaskLine>
            <GrowLine className="mt-8 h-px w-16 bg-(--tl-ink)" />
            <p className="mt-8 text-base leading-relaxed">
              {couple[0].shortName} &amp; {couple[1].shortName}
              <br />
              <span className="text-(--tl-slate)">{date.date}</span>
            </p>
          </div>
          <OpenInvitationButton className="group/btn inline-flex min-h-12 items-center gap-3 self-start border-b border-(--tl-ink) pb-1 text-sm font-medium tracking-[0.2em] uppercase focus-visible:ring-2 focus-visible:ring-(--tl-blue) focus-visible:ring-offset-4 focus-visible:outline-none">
            Mở thiệp
            <ArrowRight className="size-4 transition group-hover/btn:translate-x-1" aria-hidden />
          </OpenInvitationButton>
        </div>
      </CoverOverlay>

      {/* ---------- Đầu thiệp ---------- */}
      <header className="mx-auto max-w-md px-8 pt-16">
        <HeroItem delay={0.5} variant="fade">
          <p className="text-[0.7rem] font-medium tracking-[0.45em] text-(--tl-slate) uppercase">
            Chúng tôi kết hôn
          </p>
        </HeroItem>
        <h1 className="mt-8 font-(family-name:--font-tl-serif) text-[3.4rem] leading-[1.08] font-light italic">
          <MaskLine delay={0.7}>{couple[0].shortName}</MaskLine>
          <MaskLine delay={0.9}>
            <span className="font-(family-name:--font-tl-sans) text-4xl font-extralight not-italic">
              &amp;{' '}
            </span>
            {couple[1].shortName}
          </MaskLine>
        </h1>

        <WeddingCalendar iso={featured.startAt} />

        <p className="mt-6 text-sm">
          {date.weekday} · {date.time} — {featured.title}
        </p>
        {featured.lunarText && <p className="text-sm text-(--tl-slate)">{featured.lunarText}</p>}
      </header>

      <figure className="mx-auto mt-14 max-w-md">
        <CurtainReveal from="left">
          <ParallaxImage className="aspect-[4/5] w-full" strength={36}>
            <Image
              src={invitation.cover.src}
              alt={invitation.cover.alt}
              fill
              loading="eager"
              fetchPriority="high"
              sizes="(min-width: 448px) 448px, 100vw"
              className="object-cover"
            />
          </ParallaxImage>
        </CurtainReveal>
        {invitation.quote && (
          <figcaption className="px-8 pt-5 font-(family-name:--font-tl-serif) text-lg leading-relaxed text-(--tl-slate) italic">
            {invitation.quote}
          </figcaption>
        )}
      </figure>

      {/* ---------- Lời mời ---------- */}
      <Section label="Lời mời">
        <Reveal>
          <p className="text-lg leading-relaxed">
            Trân trọng kính mời{' '}
            <span className="font-(family-name:--font-tl-serif) italic">
              {inviteeInSentence(guest)}
            </span>{' '}
            tới dự lễ thành hôn của chúng tôi.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-6">
            {couple.map((person) => (
              <Family
                key={person.fullName}
                person={person}
                label={SIDE_LABEL[person === invitation.groom ? 'groom' : 'bride']}
              />
            ))}
          </div>
        </Reveal>
      </Section>

      {/* ---------- Đếm ngược ---------- */}
      <Section label="Còn lại">
        <Reveal>
          <Countdown
            target={featured.startAt}
            className="divide-x divide-(--tl-mist) border-y border-(--tl-mist) py-5"
            numberClassName="font-(family-name:--font-tl-serif) text-4xl font-light"
            labelClassName="mt-1 text-[0.65rem] tracking-[0.3em] text-(--tl-slate) uppercase"
          />
        </Reveal>
      </Section>

      {/* ---------- Sự kiện ---------- */}
      <Section label="Lịch trình">
        {groups ? (
          groups.map((group) => (
            <div key={group.side} className="mb-10 last:mb-0">
              <p className="mb-2 text-xs font-medium tracking-[0.3em] text-(--tl-slate) uppercase">
                {group.label}
              </p>
              <EventList events={group.events} calendarCouple={calendarCouple} />
            </div>
          ))
        ) : (
          <EventList events={events} calendarCouple={calendarCouple} />
        )}
      </Section>

      {/* ---------- Chuyện tình ---------- */}
      {invitation.story.length > 0 && (
        <Section label="Câu chuyện">
          <div className="space-y-14">
            {invitation.story.map((item) => (
              <Reveal key={item.title}>
                <p className="text-xs font-medium tracking-[0.3em] text-(--tl-slate) uppercase">
                  {item.date}
                </p>
                <h3 className="mt-2 font-(family-name:--font-tl-serif) text-2xl italic">
                  {item.title}
                </h3>
                <p className="mt-2 leading-relaxed">{item.text}</p>
                {item.photo && (
                  <Image
                    src={item.photo.src}
                    width={item.photo.width}
                    height={item.photo.height}
                    alt={item.photo.alt}
                    sizes="(min-width: 448px) 384px, 85vw"
                    className="mt-5 h-auto w-full"
                  />
                )}
              </Reveal>
            ))}
          </div>
        </Section>
      )}

      {/* ---------- Album ---------- */}
      {invitation.gallery.length > 0 && (
        <Section label="Album">
          <Album photos={invitation.gallery} className="gap-1" />
        </Section>
      )}

      {/* ---------- Xác nhận tham dự + sổ lưu bút ---------- */}
      {rsvpState(invitation) !== 'disabled' && (
        <Section label="Xác nhận">
          <Reveal style={feedback}>
            <RsvpForm invitation={invitation} guest={guest} />
          </Reveal>
        </Section>
      )}
      {invitation.wishesEnabled !== false && (
        <Section label="Lời chúc">
          <div style={feedback}>
            <WishesBoard guest={guest} />
          </div>
        </Section>
      )}

      {/* ---------- Lời cảm ơn ---------- */}
      <footer className="mx-auto max-w-md px-8 pt-20 pb-24">
        <GrowLine className="h-px w-full bg-(--tl-ink)" />
        <p className="mt-10 font-(family-name:--font-tl-serif) text-3xl leading-snug italic">
          Cảm ơn vì đã cùng chúng tôi bắt đầu chương mới.
        </p>
        <p className="mt-6 text-sm text-(--tl-slate)">
          {couple[0].shortName} &amp; {couple[1].shortName} · {date.date}
        </p>
        <p className="mt-16 text-[0.65rem] tracking-[0.3em] text-(--tl-slate) uppercase">
          Thiệp Hồng
        </p>
      </footer>
    </InvitationShell>
  )
}

/* ---------------------------------------------------------------- */

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="mx-auto max-w-md px-8 pt-20">
      <div className="mb-8 flex items-center gap-4">
        <h2 className="shrink-0 text-[0.7rem] font-medium tracking-[0.45em] text-(--tl-slate) uppercase">
          {label}
        </h2>
        <GrowLine className="h-px flex-1 bg-(--tl-mist)" />
      </div>
      {children}
    </section>
  )
}

/** Tờ lịch tháng cưới — ngày cưới được khoanh tròn bằng nét vẽ tay */
function WeddingCalendar({ iso }: { iso: string }) {
  const { day, monthLabel } = eventDateParts(iso)
  const weddingDay = Number(day)
  const weeks = monthGrid(iso)

  return (
    <Reveal plain className="group/cal mt-12 border-t border-(--tl-ink) pt-5">
      <p className="flex items-baseline justify-between">
        <span className="font-(family-name:--font-tl-serif) text-xl italic">{monthLabel}</span>
        <span className="text-xs tracking-[0.3em] text-(--tl-slate) uppercase">Lưu ngày</span>
      </p>
      <table
        className="mt-4 w-full table-fixed text-center text-sm"
        aria-label={`Lịch ${monthLabel}`}
      >
        <thead>
          <tr>
            {WEEKDAYS.map((w) => (
              <th
                key={w}
                scope="col"
                className="pb-2 text-[0.65rem] font-medium tracking-widest text-(--tl-slate)"
              >
                {w}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((d, di) => (
                <td key={di} className="relative py-1.5">
                  {d === weddingDay ? (
                    <span className="relative inline-block font-semibold text-(--tl-blue)">
                      {d}
                      <HandCircle />
                      <span className="sr-only"> (ngày cưới)</span>
                    </span>
                  ) : (
                    <span className={cn(d === null && 'invisible')}>{d ?? '·'}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Reveal>
  )
}

function HandCircle() {
  return (
    <svg
      viewBox="0 0 60 44"
      aria-hidden
      className="pointer-events-none absolute top-1/2 left-1/2 h-10 w-14 -translate-x-1/2 -translate-y-1/2 overflow-visible"
    >
      <path
        d="M34 4 C 12 2, 2 14, 5 25 C 8 37, 30 42, 46 36 C 60 30, 58 12, 44 7 C 36 4, 24 5, 16 9"
        fill="none"
        stroke="var(--tl-blue)"
        strokeWidth="1.6"
        strokeLinecap="round"
        pathLength={1}
        className="transition-[stroke-dashoffset] delay-300 duration-[1400ms] ease-out [stroke-dasharray:1] [stroke-dashoffset:1] group-data-shown/cal:[stroke-dashoffset:0] motion-reduce:transition-none motion-reduce:[stroke-dashoffset:0]"
      />
    </svg>
  )
}

function Family({ person, label }: { person: Person; label: string }) {
  return (
    <div className="text-sm leading-relaxed">
      <p className="text-xs font-medium tracking-[0.3em] text-(--tl-slate) uppercase">{label}</p>
      {person.father && <p className="mt-3">{person.father}</p>}
      {person.mother && <p>{person.mother}</p>}
      <p className="mt-4 text-xs text-(--tl-slate)">{person.title}</p>
      <p className="font-(family-name:--font-tl-serif) text-xl font-normal italic">
        {person.fullName}
      </p>
    </div>
  )
}

function EventList({
  events,
  calendarCouple,
}: {
  events: WeddingEvent[]
  calendarCouple: TemplateProps['calendarCouple']
}) {
  return (
    <ul className="divide-y divide-(--tl-mist) border-y border-(--tl-mist)">
      {events.map((event) => {
        const d = eventDateParts(event.startAt)
        return (
          <Reveal as="li" key={event.id} className="grid grid-cols-[5.5rem_1fr] gap-4 py-6">
            <div>
              <p className="font-(family-name:--font-tl-serif) text-3xl font-light">{d.time}</p>
              <p className="mt-1 text-xs text-(--tl-slate)">
                {d.day}.{d.month}
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold">{event.title}</h3>
              <p className="mt-1 text-sm">{event.venue}</p>
              <p className="text-sm text-(--tl-slate)">{event.address}</p>
              <p className="mt-1 text-xs text-(--tl-slate)">
                {d.weekday}
                {event.lunarText ? ` · ${event.lunarText}` : ''}
              </p>
              <EventActions
                event={event}
                couple={calendarCouple}
                className="mt-3 gap-x-5 gap-y-0"
                buttonClassName="min-h-10 px-0 text-xs font-medium tracking-[0.15em] uppercase underline-offset-4 hover:underline focus-visible:ring-(--tl-blue)"
              />
            </div>
          </Reveal>
        )
      })}
    </ul>
  )
}
