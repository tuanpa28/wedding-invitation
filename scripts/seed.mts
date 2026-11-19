// Ghi dữ liệu vào Firestore bằng Admin SDK (bỏ qua Security Rules).
//
//   npm run seed                 → Firestore Emulator: thiệp mẫu + khách mẫu + admin thử
//   npm run seed -- --prod       → project thật: chỉ ghi danh sách admin (ADMIN_EMAILS);
//                                  nếu chưa có nội dung thiệp thì ghi thiệp mẫu để xem thử
//   npm run seed -- --prod --demo → project thật: GHI ĐÈ nội dung thiệp + khách bằng dữ liệu mẫu
//
// Project thật cần file khoá service account (Firebase Console → Project settings →
// Service accounts → Generate new private key), đường dẫn đặt trong GOOGLE_APPLICATION_CREDENTIALS.
import nextEnv from '@next/env'
import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import type { WeddingDoc } from '../src/lib/invitation/types'
import { demoGuests, demoInvitation } from '../src/mocks/invitations'

nextEnv.loadEnvConfig(process.cwd())

const args = new Set(process.argv.slice(2))
const prod = args.has('--prod')
const overwriteDemo = !prod || args.has('--demo')

const EMULATOR_PROJECT_ID = 'demo-thiephong'
const EMULATOR_ADMIN = 'admin@thiephong.test'

if (prod) {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error('Thiếu GOOGLE_APPLICATION_CREDENTIALS (đường dẫn file khoá service account)')
  }
  delete process.env.FIRESTORE_EMULATOR_HOST
} else {
  process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8085'
}

const projectId = prod ? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID : EMULATOR_PROJECT_ID
if (!projectId) throw new Error('Thiếu NEXT_PUBLIC_FIREBASE_PROJECT_ID trong .env.local')

const app = initializeApp(prod ? { credential: applicationDefault(), projectId } : { projectId })
const db = getFirestore(app)
db.settings({ ignoreUndefinedProperties: true })

const adminEmails = (process.env.ADMIN_EMAILS ?? (prod ? '' : EMULATOR_ADMIN))
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)
if (prod && adminEmails.length === 0) {
  throw new Error('Thiếu ADMIN_EMAILS trong .env.local (email Google của người quản trị)')
}

const { slug, ...wedding } = demoInvitation
void slug // thiệp duy nhất, không cần slug
const weddingDoc: WeddingDoc = wedding

console.log(`→ ${prod ? `project ${projectId}` : 'Firestore Emulator'}`)

await db.doc('site/admins').set({ emails: adminEmails })
console.log(`✓ admin: ${adminEmails.join(', ')}`)

const weddingRef = db.doc('site/wedding')
if (overwriteDemo || !(await weddingRef.get()).exists) {
  await weddingRef.set(weddingDoc)
  const batch = db.batch()
  for (const { code, ...guest } of demoGuests) {
    batch.set(db.doc(`guests/${code}`), { ...guest, openCount: 0 })
  }
  await batch.commit()
  console.log(`✓ thiệp mẫu ${demoInvitation.groom.shortName} & ${demoInvitation.bride.shortName}`)
  console.log(`✓ khách mẫu: ${demoGuests.map((g) => `/m/${g.code}`).join(', ')}`)
} else {
  console.log('• Đã có nội dung thiệp → giữ nguyên (thêm --demo để ghi đè bằng dữ liệu mẫu)')
}
