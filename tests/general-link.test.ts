import { describe, expect, it } from 'vitest'
import { mainEvent } from '@/lib/invitation/helpers'
import type { WeddingEvent } from '@/lib/invitation/types'
import { demoInvitation } from '@/mocks/invitations'
import { buildTemplateProps } from '@/templates/types'

const ev = (id: string, side: WeddingEvent['side'], type: WeddingEvent['type'], day: number) =>
  ({
    id,
    side,
    type,
    title: id,
    startAt: `2027-01-${String(day).padStart(2, '0')}T10:00:00+07:00`,
    venue: 'v',
    address: 'a',
  }) satisfies WeddingEvent

describe('link chung chỉ mời chung chung', () => {
  it('ưu tiên sự kiện chung hai bên, rồi tiệc cưới, rồi sự kiện sớm nhất', () => {
    expect(
      mainEvent([ev('vu-quy', 'bride', 'vu_quy', 8), ev('tiec-chung', 'both', 'tiec_cuoi', 10)])
        ?.id,
    ).toBe('tiec-chung')
    expect(
      mainEvent([ev('vu-quy', 'bride', 'vu_quy', 8), ev('tiec-trai', 'groom', 'tiec_cuoi', 9)])?.id,
    ).toBe('tiec-trai')
    expect(
      mainEvent([ev('an-hoi', 'groom', 'an_hoi', 5), ev('vu-quy', 'bride', 'vu_quy', 8)])?.id,
    ).toBe('an-hoi')
    expect(mainEvent([])).toBeUndefined()
  })

  it('link chung: một sự kiện; link riêng: mọi sự kiện của bên khách', () => {
    const general = buildTemplateProps(demoInvitation)
    expect(general.events).toHaveLength(1)
    expect(general.featured).toBe(general.events[0])

    const groomGuest = buildTemplateProps(demoInvitation, {
      code: 'nam2027',
      side: 'groom',
      displayName: 'Anh Nam',
    })
    expect(groomGuest.events.length).toBeGreaterThan(1)
    expect(groomGuest.events.every((e) => e.side === 'groom' || e.side === 'both')).toBe(true)
    expect(groomGuest.couple[0]).toBe(demoInvitation.groom)
  })
})
