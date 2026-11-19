import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app'

/**
 * Chạy với Firebase Emulator (máy local, không cần project thật) khi
 * NEXT_PUBLIC_FIREBASE_EMULATOR=true. Project "demo-*" chỉ tồn tại trong emulator.
 */
export const USE_EMULATOR = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === 'true'

export const EMULATOR_PROJECT_ID = 'demo-thiephong'
/** Khớp với firebase.json → emulators.firestore.port */
export const FIRESTORE_EMULATOR_PORT = 8085

// Cấu hình web của Firebase là thông tin công khai (bảo mật nằm ở firestore.rules)
const firebaseOptions: FirebaseOptions = USE_EMULATOR
  ? { apiKey: 'demo-key', projectId: EMULATOR_PROJECT_ID, appId: 'demo-app' }
  : {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }

export function getFirebaseApp() {
  return getApps().length ? getApp() : initializeApp(firebaseOptions)
}
