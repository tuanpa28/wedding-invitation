// Dữ liệu cho trang thiệp của khách. Dùng Firestore Lite (nhẹ hơn nhiều, không realtime)
// vì trang thiệp chỉ cần đọc một lần.
import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getFirestore,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore,
} from 'firebase/firestore/lite'
import { DEFAULT_COVER } from '@/lib/invitation/defaults'
import type {
  Guest,
  GuestDoc,
  Invitation,
  RsvpInput,
  WeddingDoc,
  WishInput,
} from '@/lib/invitation/types'
import { isValidGuestCode } from '@/lib/invitation/validation'
import { FIRESTORE_EMULATOR_PORT, getFirebaseApp, USE_EMULATOR } from './config'

/** Id cố định dùng trong UID file lịch (.ics) */
export const WEDDING_ID = 'thiep-cuoi'

let db: Firestore | undefined

function getDb() {
  if (!db) {
    db = getFirestore(getFirebaseApp())
    if (USE_EMULATOR) connectFirestoreEmulator(db, '127.0.0.1', FIRESTORE_EMULATOR_PORT)
  }
  return db
}

/** Nội dung thiệp, hoặc null nếu chưa có (chưa seed / chưa nhập trong trang quản lý) */
export async function fetchInvitation(): Promise<Invitation | null> {
  const snap = await getDoc(doc(getDb(), 'site', 'wedding'))
  if (!snap.exists()) return null
  const data = snap.data() as WeddingDoc
  return { ...data, slug: WEDDING_ID, cover: data.cover ?? DEFAULT_COVER }
}

export interface GuestWithOpenState extends Guest {
  firstOpened: boolean
}

/** Khách theo mã; mã sai định dạng hoặc không có → null */
export async function fetchGuest(code: string): Promise<GuestWithOpenState | null> {
  if (!isValidGuestCode(code)) return null
  const snap = await getDoc(doc(getDb(), 'guests', code))
  if (!snap.exists()) return null
  const data = snap.data() as GuestDoc & { firstOpenedAt?: unknown }
  return {
    code,
    side: data.side,
    displayName: data.displayName,
    maxAttendees: data.maxAttendees,
    firstOpened: data.firstOpenedAt === undefined,
  }
}

/**
 * Ghi nhận khách đã mở thiệp (firestore.rules chỉ cho tăng openCount 1 đơn vị).
 * Mỗi phiên trình duyệt chỉ ghi một lần để tiết kiệm lượt ghi. Lỗi thì bỏ qua.
 */
export async function recordGuestOpen(guest: GuestWithOpenState) {
  const key = `thiephong:opened:${guest.code}`
  try {
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
  } catch {
    // trình duyệt chặn storage → vẫn ghi
  }
  try {
    await updateDoc(doc(getDb(), 'guests', guest.code), {
      openCount: increment(1),
      lastOpenedAt: serverTimestamp(),
      ...(guest.firstOpened ? { firstOpenedAt: serverTimestamp() } : {}),
    })
  } catch {
    // không ảnh hưởng tới việc xem thiệp
  }
}

/* ------------------------------------------------------------------ */
/* RSVP + lời chúc                                                     */
/* ------------------------------------------------------------------ */

const isPermissionDenied = (error: unknown) =>
  (error as { code?: string } | null)?.code === 'permission-denied'

/**
 * Gửi hoặc sửa RSVP. Khách không đọc được bản ghi (rules) nên thử tạo mới trước;
 * nếu đã có (gửi lần 2, hoặc từ máy khác) thì sửa — giữ nguyên createdAt.
 */
export async function submitRsvp(id: string, input: RsvpInput) {
  const ref = doc(getDb(), 'rsvps', id)
  const data = { ...withoutUndefined(input), updatedAt: serverTimestamp() }
  try {
    await setDoc(ref, { ...data, createdAt: serverTimestamp() })
  } catch (error) {
    if (!isPermissionDenied(error)) throw error
    await updateDoc(ref, data)
  }
}

export async function submitWish(input: WishInput) {
  await addDoc(collection(getDb(), 'wishes'), {
    ...withoutUndefined(input),
    createdAt: serverTimestamp(),
    hidden: false,
  })
}

function withoutUndefined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T
}
