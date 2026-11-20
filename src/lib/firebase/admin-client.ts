// Firebase cho trang quản lý: Auth (Google) + Firestore đầy đủ (không phải bản Lite).
// Chỉ được import từ /admin để trang thiệp của khách không phải tải thêm.
import {
  connectAuthEmulator,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth'
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Timestamp,
} from 'firebase/firestore'
import type { GuestDoc, RsvpInput, WeddingDoc, WishInput } from '@/lib/invitation/types'
import { toFirestore } from '@/lib/validators/wedding'
import { getFirebaseApp, USE_EMULATOR } from './config'
import { getFullDb } from './full-db'

const AUTH_EMULATOR_URL = 'http://127.0.0.1:9099'

let auth: Auth | undefined

export function getAdminAuth() {
  if (!auth) {
    auth = getAuth(getFirebaseApp())
    auth.languageCode = 'vi'
    if (USE_EMULATOR) connectAuthEmulator(auth, AUTH_EMULATOR_URL, { disableWarnings: true })
  }
  return auth
}

const getAdminDb = getFullDb

export const onAdminAuthChange = (callback: (user: User | null) => void) =>
  onAuthStateChanged(getAdminAuth(), callback)

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  try {
    await signInWithPopup(getAdminAuth(), provider)
  } catch (error) {
    // Trình duyệt trong app (Zalo, Messenger...) hay chặn popup → chuyển sang redirect
    if ((error as { code?: string }).code === 'auth/popup-blocked') {
      await signInWithRedirect(getAdminAuth(), provider)
      return
    }
    throw error
  }
}

/**
 * Chỉ dùng với Auth Emulator (test tự động): emulator nhận "id token" Google giả dạng JSON.
 * Project thật từ chối token này.
 */
export function signInForEmulatorTest(email: string) {
  if (!USE_EMULATOR) throw new Error('Chỉ dùng được với emulator')
  const fakeIdToken = JSON.stringify({ sub: email, email, email_verified: true })
  return signInWithCredential(getAdminAuth(), GoogleAuthProvider.credential(fakeIdToken))
}

export const signOutAdmin = () => signOut(getAdminAuth())

/**
 * Tài khoản có phải admin không: chỉ admin đọc được site/admins (firestore.rules),
 * người khác nhận lỗi permission-denied.
 */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    await getDoc(doc(getAdminDb(), 'site', 'admins'))
    return true
  } catch (error) {
    if ((error as { code?: string }).code === 'permission-denied') return false
    throw error
  }
}

/* ------------------------------------------------------------------ */
/* Người quản lý                                                       */
/* ------------------------------------------------------------------ */

const adminsRef = () => doc(getAdminDb(), 'site', 'admins')

/** Danh sách email quản trị, cập nhật ngay khi người khác thêm/bớt */
export function subscribeAdmins(
  onChange: (emails: string[]) => void,
  onError: (error: unknown) => void,
) {
  return onSnapshot(
    adminsRef(),
    (snap) => onChange(((snap.data()?.emails as string[] | undefined) ?? []).slice()),
    onError,
  )
}

/** Lưu danh sách email quản trị (rules không cho tự xoá mình, tối đa 10 email) */
export const saveAdmins = (emails: string[]) => updateDoc(adminsRef(), { emails })

/** Email của tài khoản đang đăng nhập (chữ thường) */
export const currentAdminEmail = () => getAdminAuth().currentUser?.email?.toLowerCase() ?? ''

const weddingRef = () => doc(getAdminDb(), 'site', 'wedding')

/** Nội dung thiệp hiện tại (null nếu chưa có — project mới) */
export async function loadWedding(): Promise<WeddingDoc | null> {
  const snap = await getDoc(weddingRef())
  return snap.exists() ? (snap.data() as WeddingDoc) : null
}

/** Thiệp trống cho project mới: lưu lần đầu sẽ ghi cả document */
export const EMPTY_WEDDING: WeddingDoc = {
  templateId: 'song-hy',
  groom: { fullName: 'Chú rể', shortName: 'Chú rể' },
  bride: { fullName: 'Cô dâu', shortName: 'Cô dâu' },
  events: [],
  gallery: [],
}

/**
 * Lưu một phần nội dung thiệp. Field có giá trị `null` sẽ bị xoá khỏi document.
 * Mỗi field cấp một (groom, events, gallery, ...) được ghi đè nguyên giá trị.
 */
export async function saveWedding(
  patch: Partial<Record<keyof WeddingDoc, unknown>>,
  exists: boolean,
) {
  const clean = toFirestore(patch) as Record<string, unknown>
  if (!exists) {
    const full = { ...EMPTY_WEDDING, ...clean }
    for (const [key, value] of Object.entries(full)) if (value === null) delete full[key as never]
    await setDoc(weddingRef(), full)
    return
  }
  const update: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(clean)) {
    update[key] = value === null ? deleteField() : value
  }
  await updateDoc(weddingRef(), update)
}

/* ------------------------------------------------------------------ */
/* Khách mời                                                           */
/* ------------------------------------------------------------------ */

/** Khách trong trang quản lý: dữ liệu + trạng thái đã mở thiệp */
export interface AdminGuest extends Omit<GuestDoc, 'sentAt'> {
  code: string
  sentAt?: Date
  firstOpenedAt?: Date
  lastOpenedAt?: Date
}

/** Theo dõi danh sách khách theo thời gian thực (khách vừa mở thiệp là thấy ngay) */
export function subscribeGuests(
  onChange: (guests: AdminGuest[]) => void,
  onError: (error: unknown) => void,
) {
  return onSnapshot(
    collection(getAdminDb(), 'guests'),
    (snap) => {
      const guests = snap.docs.map((d) => {
        const data = d.data() as GuestDoc & {
          firstOpenedAt?: Timestamp
          lastOpenedAt?: Timestamp
          sentAt?: Timestamp
        }
        return {
          ...data,
          code: d.id,
          sentAt: data.sentAt?.toDate(),
          firstOpenedAt: data.firstOpenedAt?.toDate(),
          lastOpenedAt: data.lastOpenedAt?.toDate(),
        }
      })
      guests.sort((a, b) => a.displayName.localeCompare(b.displayName, 'vi'))
      onChange(guests)
    },
    onError,
  )
}

type GuestFields = Pick<GuestDoc, 'displayName' | 'side' | 'group' | 'maxAttendees'>

/** Thêm khách mới (mã = id document, không đổi được sau khi tạo) */
export async function createGuest(code: string, fields: GuestFields) {
  const ref = doc(getAdminDb(), 'guests', code)
  if ((await getDoc(ref)).exists()) {
    throw Object.assign(new Error('Mã này đã có khách khác dùng'), { code: 'already-exists' })
  }
  await setDoc(ref, { ...toFirestore(fields), openCount: 0 })
}

/** Sửa thông tin khách; giữ nguyên số lần mở thiệp. Ô để trống thì xoá field. */
export function updateGuest(code: string, fields: GuestFields) {
  return updateDoc(doc(getAdminDb(), 'guests', code), {
    displayName: fields.displayName,
    side: fields.side,
    group: fields.group ?? deleteField(),
    maxAttendees: fields.maxAttendees ?? deleteField(),
  })
}

/** Đánh dấu đã gửi / chưa gửi link cho nhiều khách (mỗi lô ≤ 400 thao tác) */
export async function setGuestsSent(codes: string[], sent: boolean) {
  const db = getAdminDb()
  for (let i = 0; i < codes.length; i += 400) {
    const batch = writeBatch(db)
    for (const code of codes.slice(i, i + 400)) {
      batch.update(doc(db, 'guests', code), { sentAt: sent ? serverTimestamp() : deleteField() })
    }
    await batch.commit()
  }
}

export const deleteGuest = (code: string) => deleteDoc(doc(getAdminDb(), 'guests', code))

/** Nhập nhiều khách một lần (mỗi lô ≤ 400 thao tác, giới hạn của Firestore là 500) */
export async function importGuests(guests: (GuestFields & { code: string })[]) {
  const db = getAdminDb()
  for (let i = 0; i < guests.length; i += 400) {
    const batch = writeBatch(db)
    for (const { code, ...fields } of guests.slice(i, i + 400)) {
      batch.set(doc(db, 'guests', code), { ...toFirestore(fields), openCount: 0 })
    }
    await batch.commit()
  }
}

/* ------------------------------------------------------------------ */
/* RSVP + lời chúc (trang quản lý)                                     */
/* ------------------------------------------------------------------ */

export interface AdminRsvp extends RsvpInput {
  id: string
  createdAt?: Date
  updatedAt?: Date
}

export interface AdminWish extends WishInput {
  id: string
  hidden: boolean
  createdAt?: Date
}

const toDate = (value: unknown) => (value as Timestamp | undefined)?.toDate?.()

export function subscribeRsvps(
  onChange: (rsvps: AdminRsvp[]) => void,
  onError: (e: unknown) => void,
) {
  return onSnapshot(
    query(collection(getAdminDb(), 'rsvps'), orderBy('updatedAt', 'desc')),
    (snap) =>
      onChange(
        snap.docs.map((d) => {
          const data = d.data()
          return {
            ...(data as RsvpInput),
            id: d.id,
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
          }
        }),
      ),
    onError,
  )
}

/** Mọi lời chúc kể cả đã ẩn (chỉ admin đọc được) */
export function subscribeAllWishes(
  onChange: (wishes: AdminWish[]) => void,
  onError: (e: unknown) => void,
) {
  return onSnapshot(
    query(collection(getAdminDb(), 'wishes'), orderBy('createdAt', 'desc')),
    (snap) =>
      onChange(
        snap.docs.map((d) => {
          const data = d.data()
          return {
            ...(data as WishInput),
            id: d.id,
            hidden: data.hidden === true,
            createdAt: toDate(data.createdAt),
          }
        }),
      ),
    onError,
  )
}

export const setWishHidden = (id: string, hidden: boolean) =>
  updateDoc(doc(getAdminDb(), 'wishes', id), { hidden })

export const deleteWish = (id: string) => deleteDoc(doc(getAdminDb(), 'wishes', id))

export const deleteRsvp = (id: string) => deleteDoc(doc(getAdminDb(), 'rsvps', id))
