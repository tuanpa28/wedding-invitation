import { Alegreya, Prata } from 'next/font/google'
import { WeddingImage as Image } from '@/components/invitation/wedding-image'
import type { CSSProperties, ReactNode } from 'react'
import { Album } from '@/components/invitation/album'
import { Countdown } from '@/components/invitation/countdown'
import { EventActions } from '@/components/invitation/event-actions'
import { GiftSection, hasGiftAccounts } from '@/components/invitation/feedback/gift-section'
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
  AnimatedText,
  FallingParticles,
  HeroItem,
  ParallaxImage,
} from '@/components/invitation/motion'
import { Reveal } from '@/components/invitation/reveal'
import {
  eventDateParts,
  inviteeInSentence,
  inviteeName,
  SIDE_LABEL,
} from '@/lib/invitation/helpers'
import type { Person, WeddingEvent } from '@/lib/invitation/types'
import { cn } from '@/lib/utils'
import type { TemplateProps } from '../types'

// Song Hỷ — truyền thống: son mài đỏ thẫm, vàng kim nhạt, giấy dó.
// Điểm nhấn: phong bì là hai cánh cổng, con dấu 囍 chia đôi; bấm mở thì cổng xoay mở (3D),
// ánh vàng loé ra, tên cô dâu chú rể hiện từng chữ, kim tuyến và cánh hoa đỏ rơi.

const display = Prata({
  weight: '400',
  subsets: ['latin', 'vietnamese'],
  variable: '--font-sh-display',
  display: 'swap',
  preload: false,
})

const body = Alegreya({
  subsets: ['latin', 'vietnamese'],
  style: ['normal', 'italic'],
  variable: '--font-sh-body',
  display: 'swap',
  preload: false,
})

const palette = {
  '--sh-lacquer': '#6b130e',
  '--sh-lacquer-deep': '#4a0c08',
  '--sh-red': '#9a2318',
  '--sh-gold': '#d3b064',
  '--sh-gold-pale': '#ecdcae',
  '--sh-paper': '#f4e8d3',
  '--sh-paper-light': '#faf3e6',
  '--sh-ink': '#3b1a12',
} as CSSProperties

// Form RSVP / sổ lưu bút: viền vàng, nút son, góc vuông kiểu truyền thống
const feedback = feedbackTheme({
  accent: 'var(--sh-red)',
  onAccent: 'var(--sh-gold-pale)',
  ink: 'var(--sh-ink)',
  muted: 'rgb(59 26 18 / 0.68)',
  card: '#fffaf0',
  line: 'rgb(211 176 100 / 0.75)',
  radius: '0px',
})

const lacquerBg =
  'bg-[radial-gradient(120%_70%_at_50%_30%,#8a1c13_0%,var(--sh-lacquer)_55%,var(--sh-lacquer-deep)_100%)]'

export default function SongHyTemplate({
  invitation,
  guest,
  events,
  featured,
  couple,
  calendarCouple,
}: TemplateProps) {
  const date = eventDateParts(featured.startAt)

  return (
    <InvitationShell
      musicUrl={invitation.musicUrl}
      openDuration={1700}
      style={palette}
      className={cn(
        display.variable,
        body.variable,
        'min-h-svh bg-(--sh-lacquer-deep) font-(family-name:--font-sh-body) text-(--sh-ink) antialiased',
      )}
      musicButtonClassName="bg-(--sh-red) text-(--sh-gold-pale) ring-1 ring-(--sh-gold)/60 focus-visible:ring-(--sh-gold)"
    >
      {/* ---------- Phong bì: hai cánh cổng ---------- */}
      <CoverOverlay>
        {/* Ánh vàng phía sau cổng, loé lên khi cổng mở */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_50%,#f7e7b4_0%,#d3b064_35%,var(--sh-lacquer-deep)_75%)] opacity-0 group-data-[phase=opening]/inv:animate-[th-flash_1.7s_ease-out_forwards] motion-reduce:hidden"
        />
        <div className="absolute inset-0 flex [perspective:1600px]">
          <Door side="left" />
          <Door side="right" />
        </div>
        {/* Quầng sáng "thở" quanh con dấu khi chờ bấm mở */}
        <div
          aria-hidden
          className="th-breathe pointer-events-none absolute top-1/2 left-1/2 z-10 -mt-[5.5rem] -ml-[5.5rem] size-44 rounded-full border border-(--sh-gold-pale)/40 transition-opacity duration-300 group-data-[phase=opening]/inv:opacity-0"
        />
        <div className="relative z-10 flex h-full flex-col items-center justify-between px-6 py-[12svh] text-center transition-opacity duration-500 group-data-[phase=opening]/inv:opacity-0 motion-reduce:transition-none">
          <div>
            <p className="text-xs tracking-[0.35em] text-(--sh-gold-pale)/80 uppercase">
              Trân trọng kính mời
            </p>
            <p className="mt-3 font-(family-name:--font-sh-display) text-3xl leading-snug text-(--sh-gold) sm:text-4xl">
              {inviteeName(guest)}
            </p>
          </div>
          <div className="flex flex-col items-center gap-5">
            <p className="text-lg text-(--sh-gold-pale) italic">
              {couple[0].shortName} &nbsp;·&nbsp; {couple[1].shortName}
            </p>
            <OpenInvitationButton className="min-h-12 rounded-full border border-(--sh-gold) bg-(--sh-lacquer-deep)/40 px-8 text-sm tracking-[0.25em] text-(--sh-gold) uppercase transition hover:bg-(--sh-gold) hover:text-(--sh-lacquer-deep) focus-visible:ring-2 focus-visible:ring-(--sh-gold) focus-visible:ring-offset-2 focus-visible:ring-offset-(--sh-lacquer) focus-visible:outline-none">
              Mở thiệp
            </OpenInvitationButton>
          </div>
        </div>
      </CoverOverlay>

      {/* ---------- Đầu thiệp ---------- */}
      <header className={cn(lacquerBg, 'px-6 pt-16 pb-14 text-center text-(--sh-gold-pale)')}>
        <div className="mx-auto max-w-md">
          <HeroItem delay={0.7} variant="fade">
            <p className="text-xs tracking-[0.4em] text-(--sh-gold)/90 uppercase">Thư mời cưới</p>
          </HeroItem>
          <h1 className="mt-6 font-(family-name:--font-sh-display) text-[2.75rem] leading-[1.2] text-(--sh-gold)">
            <AnimatedText text={couple[0].shortName} delay={0.9} className="block" />
            <HeroItem
              delay={1.35}
              variant="zoom"
              className="block py-1 font-(family-name:--font-sh-body) text-3xl text-(--sh-gold-pale) italic"
            >
              &amp;
            </HeroItem>
            <AnimatedText text={couple[1].shortName} delay={1.5} className="block" />
          </h1>

          <HeroItem
            delay={0.8}
            variant="zoom"
            className="mx-auto mt-10 w-64 rounded-t-full border border-(--sh-gold)/70 p-2"
          >
            <ParallaxImage className="aspect-[3/4] rounded-t-full" strength={24} delay={0.8}>
              <Image
                src={invitation.cover.src}
                alt={invitation.cover.alt}
                fill
                loading="eager"
                fetchPriority="high"
                sizes="256px"
                className="object-cover"
              />
            </ParallaxImage>
          </HeroItem>

          <HeroItem delay={1.9}>
            <p className="mt-10 font-(family-name:--font-sh-display) text-2xl tracking-[0.2em] text-(--sh-gold)">
              {date.day} · {date.month} · {date.year}
            </p>
            <p className="mt-2 text-base">
              {date.weekday}, {date.time}
            </p>
            {featured.lunarText && (
              <p className="mt-1 text-sm text-(--sh-gold-pale)/75 italic">{featured.lunarText}</p>
            )}
          </HeroItem>
          {invitation.quote && (
            <HeroItem delay={2.2}>
              <p className="mx-auto mt-8 max-w-xs text-lg leading-relaxed italic">
                “{invitation.quote}”
              </p>
            </HeroItem>
          )}
        </div>
      </header>

      {/* ---------- Lời mời + gia đình hai bên ---------- */}
      <Paper>
        <Reveal className="text-center">
          <Heading>Thân mời</Heading>
          <div className="mt-8 grid grid-cols-2 gap-4 text-sm leading-relaxed">
            {couple.map((person, i) => (
              <Parents
                key={person.fullName}
                person={person}
                label={SIDE_LABEL[person === invitation.groom ? 'groom' : 'bride']}
                divider={i === 0}
              />
            ))}
          </div>

          <p className="mt-10 text-lg leading-relaxed">
            Trân trọng kính mời
            <span className="mt-1 block font-(family-name:--font-sh-display) text-2xl text-(--sh-red)">
              {inviteeName(guest)}
            </span>
            tới dự lễ thành hôn của con chúng tôi
          </p>

          <div className="mt-8 space-y-5">
            {couple.map((person, i) => (
              <div key={person.fullName}>
                {i === 1 && <Ornament className="mx-auto mb-5 w-24" />}
                {person.title && (
                  <p className="text-xs tracking-[0.3em] text-(--sh-ink)/60 uppercase">
                    {person.title}
                  </p>
                )}
                <p className="mt-1 font-(family-name:--font-sh-display) text-3xl leading-tight text-(--sh-red)">
                  {person.fullName}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </Paper>

      {/* ---------- Đếm ngược ---------- */}
      <section className={cn(lacquerBg, 'px-6 py-14 text-center text-(--sh-gold-pale)')}>
        <Reveal variant="zoom" className="mx-auto max-w-md">
          <p className="text-xs tracking-[0.35em] text-(--sh-gold) uppercase">Còn lại</p>
          <Countdown
            target={featured.startAt}
            className="mt-6 gap-2"
            itemClassName="rounded-sm border border-(--sh-gold)/50 py-3"
            numberClassName="font-(family-name:--font-sh-display) text-3xl text-(--sh-gold)"
            labelClassName="mt-1 text-xs tracking-widest uppercase"
          />
          <p className="mt-6 text-sm italic">tới {featured.title.toLowerCase()}</p>
        </Reveal>
      </section>

      {/* ---------- Sự kiện ---------- */}
      <Paper>
        <Heading>Lễ cưới</Heading>
        <div className="mt-10 space-y-5">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              actions={<EventActions event={event} couple={calendarCouple} {...actionStyle} />}
            />
          ))}
        </div>
      </Paper>

      {/* ---------- Album ---------- */}
      {invitation.gallery.length > 0 && (
        <section className={cn(lacquerBg, 'px-4 py-16')}>
          <div className="mx-auto max-w-md">
            <Heading tone="gold">Khoảnh khắc</Heading>
            <Album
              photos={invitation.gallery}
              className="mt-10"
              itemClassName="border border-(--sh-gold)/40 p-1"
            />
          </div>
        </section>
      )}

      {/* ---------- Xác nhận tham dự + sổ lưu bút ---------- */}
      {rsvpState(invitation) !== 'disabled' && (
        <Paper light>
          <Heading>Xác nhận tham dự</Heading>
          <Reveal className="mt-8" style={feedback}>
            <RsvpForm invitation={invitation} guest={guest} />
          </Reveal>
        </Paper>
      )}
      {invitation.wishesEnabled !== false && (
        <Paper>
          <Heading>Sổ lưu bút</Heading>
          <div className="mt-8" style={feedback}>
            <WishesBoard guest={guest} />
          </div>
        </Paper>
      )}

      {hasGiftAccounts(invitation) && (
        <Paper light>
          <Heading>Mừng cưới</Heading>
          <Reveal className="mt-8" style={feedback}>
            <GiftSection invitation={invitation} guest={guest} />
          </Reveal>
        </Paper>
      )}

      {/* ---------- Lời cảm ơn ---------- */}
      <Paper>
        <Reveal className="text-center">
          <Seal className="mx-auto size-20" />
          <p className="mx-auto mt-8 max-w-xs text-lg leading-relaxed">
            Sự hiện diện của {inviteeInSentence(guest)} là niềm vinh hạnh cho gia đình chúng tôi.
          </p>
          <p className="mt-6 font-(family-name:--font-sh-display) text-2xl text-(--sh-red)">
            {couple[0].shortName} &amp; {couple[1].shortName}
          </p>
        </Reveal>
      </Paper>
      <footer className="bg-(--sh-lacquer-deep) py-6 text-center text-xs text-(--sh-gold-pale)/60">
        Thiệp Hồng
      </footer>
      <FallingParticles
        shapes={['spark', 'petal', 'spark']}
        colors={['#e8cf8a', '#b3261a', '#f4e3b0']}
        count={14}
      />
    </InvitationShell>
  )
}

const actionStyle = {
  className: 'mt-5 justify-center',
  buttonClassName:
    'rounded-full bg-(--sh-red) text-(--sh-gold-pale) hover:bg-(--sh-lacquer) focus-visible:ring-(--sh-red)',
}

/* ---------------------------------------------------------------- */

function Door({ side }: { side: 'left' | 'right' }) {
  const left = side === 'left'
  return (
    <div
      className={cn(
        lacquerBg,
        // Cánh cổng xoay quanh bản lề ở mép ngoài (3D), con dấu tách đôi theo mép giữa
        'relative h-full w-1/2 overflow-hidden transition-[transform,filter] delay-150 duration-[1500ms] ease-[cubic-bezier(0.7,0,0.2,1)] [backface-visibility:hidden] motion-reduce:transition-none',
        left
          ? 'origin-left group-data-[phase=opening]/inv:[transform:rotateY(-108deg)] group-data-[phase=opening]/inv:brightness-50'
          : 'origin-right group-data-[phase=opening]/inv:[transform:rotateY(108deg)] group-data-[phase=opening]/inv:brightness-50',
      )}
    >
      {/* Khung chỉ vàng, hở ở mép giữa hai cánh */}
      <div
        aria-hidden
        className={cn(
          'absolute inset-y-4 border-y border-(--sh-gold)/50',
          left ? 'right-0 left-4 border-l' : 'right-4 left-0 border-r',
        )}
      />
      <div
        aria-hidden
        className={cn(
          'absolute inset-y-7 border-y border-(--sh-gold)/25',
          left ? 'right-0 left-7 border-l' : 'right-7 left-0 border-r',
        )}
      />
      {/* Con dấu đặt giữa mép cánh cổng → mỗi cánh giữ một nửa */}
      <Seal
        className={cn(
          'absolute top-1/2 size-36 -translate-y-1/2',
          left ? 'right-0 translate-x-1/2' : 'left-0 -translate-x-1/2',
        )}
      />
    </div>
  )
}

/** Con dấu tròn chữ 囍 */
function Seal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <circle cx="50" cy="50" r="48" fill="var(--sh-gold)" />
      <circle cx="50" cy="50" r="43" fill="none" stroke="var(--sh-lacquer)" strokeWidth="1.2" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="var(--sh-lacquer)" strokeWidth="0.6" />
      <text
        x="50"
        y="51"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="48"
        fill="var(--sh-lacquer)"
        fontFamily='"Noto Serif SC","Noto Serif CJK SC","Songti SC","SimSun",serif'
        fontWeight="700"
      >
        囍
      </text>
    </svg>
  )
}

function Ornament({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 12" className={className} aria-hidden>
      <line x1="0" y1="6" x2="48" y2="6" stroke="var(--sh-gold)" strokeWidth="1" />
      <rect
        x="54"
        y="0.5"
        width="11"
        height="11"
        transform="rotate(45 59.5 6)"
        fill="none"
        stroke="var(--sh-gold)"
      />
      <rect
        x="57"
        y="3.5"
        width="5"
        height="5"
        transform="rotate(45 59.5 6)"
        fill="var(--sh-red)"
      />
      <line x1="72" y1="6" x2="120" y2="6" stroke="var(--sh-gold)" strokeWidth="1" />
    </svg>
  )
}

function Heading({ children, tone = 'red' }: { children: ReactNode; tone?: 'red' | 'gold' }) {
  return (
    <Reveal variant="blur" className="text-center">
      <h2
        className={cn(
          'font-(family-name:--font-sh-display) text-3xl',
          tone === 'red' ? 'text-(--sh-red)' : 'text-(--sh-gold)',
        )}
      >
        {children}
      </h2>
      <Ornament className="mx-auto mt-3 w-32" />
    </Reveal>
  )
}

function Paper({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <section
      className={cn(
        'px-6 py-16',
        light ? 'bg-(--sh-paper-light)' : 'bg-(--sh-paper)',
        // Vân giấy dó rất nhẹ
        'bg-[image:radial-gradient(rgba(59,26,18,0.035)_1px,transparent_1px)] bg-size-[6px_6px]',
      )}
    >
      <div className="mx-auto max-w-md">{children}</div>
    </section>
  )
}

function Parents({ person, label, divider }: { person: Person; label: string; divider: boolean }) {
  return (
    <div className={cn('px-1', divider && 'border-r border-(--sh-gold)/60')}>
      <p className="font-(family-name:--font-sh-display) text-base text-(--sh-red)">{label}</p>
      {person.father && <p className="mt-2">{person.father}</p>}
      {person.mother && <p>{person.mother}</p>}
      {person.address && <p className="mt-2 text-xs text-(--sh-ink)/65 italic">{person.address}</p>}
    </div>
  )
}

function EventCard({ event, actions }: { event: WeddingEvent; actions: ReactNode }) {
  const d = eventDateParts(event.startAt)
  return (
    <Reveal className="border border-(--sh-gold)/70 bg-(--sh-paper-light) px-5 py-7 text-center shadow-[0_1px_0_rgba(59,26,18,0.06)]">
      <h3 className="font-(family-name:--font-sh-display) text-2xl text-(--sh-red)">
        {event.title}
      </h3>
      {/* Số giờ dùng font thân bài, số kiểu lining: số 1 của Prata dễ nhầm với chữ l */}
      <p className="mt-4 text-4xl font-bold text-(--sh-ink) lining-nums tabular-nums">{d.time}</p>
      <p className="mt-1 text-base">
        {d.weekday}, {d.date}
      </p>
      {event.lunarText && <p className="text-sm text-(--sh-ink)/65 italic">{event.lunarText}</p>}
      <Ornament className="mx-auto my-5 w-20" />
      <p className="text-lg font-bold">{event.venue}</p>
      <p className="mt-1 text-sm leading-relaxed text-(--sh-ink)/80">{event.address}</p>
      {actions}
    </Reveal>
  )
}
