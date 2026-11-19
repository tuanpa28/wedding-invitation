import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

// RSVP + sổ lưu bút. Chạy qua `npm run test:rules`.
let env: RulesTestEnvironment
const ADMIN = 'admin@thiephong.test'
const WEDDING = {
  templateId: 'song-hy',
  groom: { fullName: 'Nguyễn Minh Tuấn', shortName: 'Minh Tuấn' },
  bride: { fullName: 'Trần Ngọc Lan', shortName: 'Ngọc Lan' },
  events: [],
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-thiephong-feedback',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
})
afterAll(() => env.cleanup())

beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'site/admins'), { emails: [ADMIN] })
    await setDoc(doc(db, 'site/wedding'), WEDDING)
    await setDoc(doc(db, 'guests/nam2027'), {
      side: 'groom',
      displayName: 'Anh Nam',
      maxAttendees: 2,
      openCount: 0,
    })
    await setDoc(doc(db, 'wishes/an'), {
      name: 'Spam',
      message: 'ẩn',
      createdAt: Timestamp.now(),
      hidden: true,
    })
  })
})

const guest = () => env.unauthenticatedContext().firestore()
const admin = () =>
  env.authenticatedContext('admin-uid', { email: ADMIN, email_verified: true }).firestore()

const rsvp = (extra: Record<string, unknown> = {}) => ({
  guestCode: 'nam2027',
  name: 'Anh Nam',
  side: 'groom',
  attending: true,
  count: 2,
  note: 'Ăn chay',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...extra,
})

describe('RSVP', () => {
  it('khách link riêng gửi rồi sửa được, chỉ một bản ghi', async () => {
    await assertSucceeds(setDoc(doc(guest(), 'rsvps/nam2027'), rsvp()))
    // Gửi lần 2 = sửa (giữ createdAt cũ)
    await assertSucceeds(
      updateDoc(doc(guest(), 'rsvps/nam2027'), {
        attending: false,
        count: 0,
        updatedAt: serverTimestamp(),
      }),
    )
    await assertFails(
      updateDoc(doc(guest(), 'rsvps/nam2027'), {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    )
  })

  it('không vượt số người tối đa của khách, sai bên hay sai mã bị chặn', async () => {
    await assertFails(setDoc(doc(guest(), 'rsvps/nam2027'), rsvp({ count: 3 })))
    await assertFails(setDoc(doc(guest(), 'rsvps/nam2027'), rsvp({ side: 'bride' })))
    await assertFails(setDoc(doc(guest(), 'rsvps/khongco'), rsvp({ guestCode: 'khongco' })))
    await assertFails(setDoc(doc(guest(), 'rsvps/abcdef'), rsvp({ guestCode: 'nam2027' })))
  })

  it('link chung: id ngẫu nhiên, tối đa 10 người, không đến thì 0 người', async () => {
    const { guestCode: _omit, ...general } = rsvp({ name: 'Bạn Hùng', count: 3 })
    void _omit
    await assertSucceeds(setDoc(doc(guest(), 'rsvps/r8Kx2pQe9aZt'), general))
    await assertFails(setDoc(doc(guest(), 'rsvps/r8Kx2pQe9aZu'), { ...general, count: 11 }))
    await assertFails(
      setDoc(doc(guest(), 'rsvps/r8Kx2pQe9aZv'), { ...general, attending: false, count: 2 }),
    )
    await assertFails(setDoc(doc(guest(), 'rsvps/r8Kx2pQe9aZw'), { ...general, admin: true }))
  })

  it('khách không đọc được RSVP của người khác, admin đọc được', async () => {
    await assertSucceeds(setDoc(doc(guest(), 'rsvps/nam2027'), rsvp()))
    await assertFails(getDoc(doc(guest(), 'rsvps/nam2027')))
    await assertFails(getDocs(collection(guest(), 'rsvps')))
    await assertSucceeds(getDocs(collection(admin(), 'rsvps')))
  })

  it('admin tắt RSVP thì không gửi được', async () => {
    await env.withSecurityRulesDisabled((ctx) =>
      updateDoc(doc(ctx.firestore(), 'site/wedding'), { rsvpEnabled: false }),
    )
    await assertFails(setDoc(doc(guest(), 'rsvps/nam2027'), rsvp()))
  })
})

describe('Sổ lưu bút', () => {
  const wish = (extra: Record<string, unknown> = {}) => ({
    name: 'Anh Nam',
    message: 'Trăm năm hạnh phúc!',
    side: 'groom',
    createdAt: serverTimestamp(),
    hidden: false,
    ...extra,
  })

  it('khách gửi lời chúc đúng định dạng', async () => {
    await assertSucceeds(setDoc(doc(collection(guest(), 'wishes')), wish()))
    await assertFails(setDoc(doc(collection(guest(), 'wishes')), wish({ hidden: true })))
    await assertFails(setDoc(doc(collection(guest(), 'wishes')), wish({ message: '' })))
    await assertFails(
      setDoc(doc(collection(guest(), 'wishes')), wish({ message: 'x'.repeat(501) })),
    )
    await assertFails(
      setDoc(doc(collection(guest(), 'wishes')), wish({ createdAt: Timestamp.fromMillis(0) })),
    )
  })

  it('khách chỉ đọc lời chúc không bị ẩn (truy vấn phải lọc hidden)', async () => {
    const visible = query(
      collection(guest(), 'wishes'),
      where('hidden', '==', false),
      orderBy('createdAt', 'desc'),
      limit(50),
    )
    await assertSucceeds(getDocs(visible))
    await assertFails(getDocs(collection(guest(), 'wishes')))
    await assertFails(getDoc(doc(guest(), 'wishes/an')))
    await assertSucceeds(getDoc(doc(admin(), 'wishes/an')))
  })

  it('chỉ admin ẩn được, và chỉ được đổi field hidden', async () => {
    await assertFails(updateDoc(doc(guest(), 'wishes/an'), { hidden: false }))
    await assertSucceeds(updateDoc(doc(admin(), 'wishes/an'), { hidden: false }))
    await assertFails(updateDoc(doc(admin(), 'wishes/an'), { message: 'sửa lời chúc' }))
  })

  it('admin tắt sổ lưu bút thì không gửi được', async () => {
    await env.withSecurityRulesDisabled((ctx) =>
      updateDoc(doc(ctx.firestore(), 'site/wedding'), { wishesEnabled: false }),
    )
    await assertFails(setDoc(doc(collection(guest(), 'wishes')), wish()))
  })
})
