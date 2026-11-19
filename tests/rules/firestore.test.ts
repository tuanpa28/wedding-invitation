import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  deleteField,
  doc,
  getDoc,
  getDocs,
  collection,
  increment,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

// Chạy qua `npm run test:rules` (firebase emulators:exec bật Firestore Emulator)
let env: RulesTestEnvironment

const ADMIN = 'admin@thiephong.test'

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-thiephong-rules',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
})

afterAll(() => env.cleanup())

beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'site/admins'), { emails: [ADMIN] })
    await setDoc(doc(db, 'site/wedding'), { templateId: 'song-hy', events: [] })
    await setDoc(doc(db, 'guests/nam2027'), { side: 'groom', displayName: 'Anh Nam', openCount: 0 })
  })
})

const guest = () => env.unauthenticatedContext().firestore()
const admin = () =>
  env.authenticatedContext('admin-uid', { email: ADMIN, email_verified: true }).firestore()
const stranger = () =>
  env.authenticatedContext('other-uid', { email: 'la@gmail.com', email_verified: true }).firestore()

describe('site/wedding', () => {
  it('khách đọc được nội dung thiệp', async () => {
    await assertSucceeds(getDoc(doc(guest(), 'site/wedding')))
  })

  it('chỉ admin sửa được', async () => {
    await assertFails(updateDoc(doc(guest(), 'site/wedding'), { templateId: 'hoa-co' }))
    await assertFails(updateDoc(doc(stranger(), 'site/wedding'), { templateId: 'hoa-co' }))
    await assertSucceeds(updateDoc(doc(admin(), 'site/wedding'), { templateId: 'hoa-co' }))
  })

  it('email đúng nhưng chưa xác minh thì không phải admin', async () => {
    const unverified = env
      .authenticatedContext('x', { email: ADMIN, email_verified: false })
      .firestore()
    await assertFails(updateDoc(doc(unverified, 'site/wedding'), { templateId: 'hoa-co' }))
  })
})

describe('site/admins', () => {
  it('khách và người lạ không xem được, không ai sửa được qua app', async () => {
    await assertFails(getDoc(doc(guest(), 'site/admins')))
    await assertFails(getDoc(doc(stranger(), 'site/admins')))
    await assertSucceeds(getDoc(doc(admin(), 'site/admins')))
    await assertFails(setDoc(doc(admin(), 'site/admins'), { emails: [ADMIN, 'la@gmail.com'] }))
    await assertFails(setDoc(doc(stranger(), 'site/admins'), { emails: ['la@gmail.com'] }))
  })
})

describe('guests', () => {
  it('khách đọc được đúng mã của mình, không liệt kê được danh sách', async () => {
    await assertSucceeds(getDoc(doc(guest(), 'guests/nam2027')))
    await assertSucceeds(getDoc(doc(guest(), 'guests/khong-co'))) // không tồn tại, không lỗi quyền
    await assertFails(getDocs(collection(guest(), 'guests')))
    await assertFails(getDocs(collection(stranger(), 'guests')))
    await assertSucceeds(getDocs(collection(admin(), 'guests')))
  })

  it('khách không tạo, sửa tên hay xoá được', async () => {
    await assertFails(setDoc(doc(guest(), 'guests/moi'), { side: 'bride', displayName: 'X' }))
    await assertFails(updateDoc(doc(guest(), 'guests/nam2027'), { displayName: 'Đổi tên' }))
    await assertSucceeds(setDoc(doc(admin(), 'guests/moi'), { side: 'bride', displayName: 'X' }))
  })

  it('mở thiệp lần đầu: tăng openCount 1, ghi thời điểm mở', async () => {
    const ref = doc(guest(), 'guests/nam2027')
    await assertSucceeds(
      updateDoc(ref, {
        openCount: increment(1),
        firstOpenedAt: serverTimestamp(),
        lastOpenedAt: serverTimestamp(),
      }),
    )
    // Lần sau: không được ghi đè firstOpenedAt
    await assertFails(
      updateDoc(ref, {
        openCount: increment(1),
        firstOpenedAt: serverTimestamp(),
        lastOpenedAt: serverTimestamp(),
      }),
    )
    await assertSucceeds(
      updateDoc(ref, { openCount: increment(1), lastOpenedAt: serverTimestamp() }),
    )
  })

  it('không gian lận được số lần mở hay thời điểm mở', async () => {
    const ref = doc(guest(), 'guests/nam2027')
    await assertFails(updateDoc(ref, { openCount: 100, lastOpenedAt: serverTimestamp() }))
    await assertFails(
      updateDoc(ref, { openCount: increment(1), lastOpenedAt: Timestamp.fromMillis(0) }),
    )
    await assertFails(
      updateDoc(ref, {
        openCount: increment(1),
        lastOpenedAt: serverTimestamp(),
        maxAttendees: 10,
      }),
    )
    await assertFails(updateDoc(ref, { openCount: deleteField() }))
  })
})

describe('mặc định chặn', () => {
  it('collection lạ không đọc/ghi được', async () => {
    await assertFails(setDoc(doc(guest(), 'spam/x'), { a: 1 }))
    await assertFails(getDoc(doc(admin(), 'spam/x')))
  })
})
