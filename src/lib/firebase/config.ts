import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'

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

/** Khoá reCAPTCHA v3 cho App Check (tuỳ chọn, chống spam — xem README → App Check) */
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

export function getFirebaseApp() {
  if (getApps().length) return getApp()
  const app = initializeApp(firebaseOptions)
  // App Check chỉ chạy ở trình duyệt, với project thật và khi đã có khoá
  if (RECAPTCHA_SITE_KEY && !USE_EMULATOR && typeof window !== 'undefined') {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    })
  }
  return app
}
