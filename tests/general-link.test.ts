import { describe, expect, it } from 'vitest'
import { demoInvitation } from '@/mocks/invitations'
import { buildTemplateProps } from '@/templates/types'

const withoutShared = {
  ...demoInvitation,
  events: demoInvitation.events.filter((e) => e.side !== 'both'),
}
const groomGuest = { code: 'nam2027', side: 'groom', displayName: 'Anh Nam' } as const

describe('mỗi link chỉ thấy lễ của mình', () => {
  it('link chung: chỉ lễ chung hai bên', () => {
    const general = buildTemplateProps(demoInvitation)
    expect(general.events.map((e) => e.side)).toEqual(['both'])
    expect(general.featured).toBe(general.events[0])
  })

  it('link chung khi chưa có lễ chung: không có sự kiện, không có ngày in lớn', () => {
    const general = buildTemplateProps(withoutShared)
    expect(general.events).toEqual([])
    expect(general.featured).toBeUndefined()
  })

  it('link riêng: chỉ lễ của bên khách, tên bên khách đứng trước', () => {
    const props = buildTemplateProps(demoInvitation, groomGuest)
    expect(props.events.map((e) => e.side)).toEqual(['groom'])
    expect(props.featured?.side).toBe('groom')
    expect(props.couple[0]).toBe(demoInvitation.groom)
  })
})
