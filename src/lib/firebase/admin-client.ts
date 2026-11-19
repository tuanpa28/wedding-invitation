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
  connectFirestoreEmulator,
  deleteField,
  doc,
  getDoc,
  getFirestore,
  setDoc,
  updateDoc,
  type Firestore,
} from 'firebase/firestore'
import type { WeddingDoc } from '@/lib/invitation/types'
import { toFirestore } from '@/lib/validators/wedding'
import { FIRESTORE_EMULATOR_PORT, getFirebaseApp, USE_EMULATOR } from './config'

const AUTH_EMULATOR_URL = 'http://127.0.0.1:9099'

let auth: Auth | undefined
let db: Firestore | undefined

export function getAdminAuth() {
  if (!auth) {
    auth = getAuth(getFirebaseApp())
    auth.languageCode = 'vi'
    if (USE_EMULATOR) connectAuthEmulator(auth, AUTH_EMULATOR_URL, { disableWarnings: true })
  }
  return auth
}

function getAdminDb() {
  if (!db) {
    db = getFirestore(getFirebaseApp())
    if (USE_EMULATOR) connectFirestoreEmulator(db, '127.0.0.1', FIRESTORE_EMULATOR_PORT)
  }
  return db
}

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
  story: [],
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
