// Firestore bản đầy đủ (có realtime) — dùng chung cho trang quản lý và sổ lưu bút.
// Trang thiệp chỉ tải module này khi khách cuộn tới sổ lưu bút.
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore'
import { FIRESTORE_EMULATOR_PORT, getFirebaseApp, USE_EMULATOR } from './config'

let db: Firestore | undefined

export function getFullDb() {
  if (!db) {
    db = getFirestore(getFirebaseApp())
    if (USE_EMULATOR) connectFirestoreEmulator(db, '127.0.0.1', FIRESTORE_EMULATOR_PORT)
  }
  return db
}
