import nextEnv from '@next/env'
import { resetTestDatabase } from './reset-db'

/** Vitest: chạy một lần trước toàn bộ test, đọc DATABASE_URL từ .env.test */
export default async function setup() {
  // Vitest đặt NODE_ENV=test → loadEnvConfig đọc .env.test
  Object.assign(process.env, { NODE_ENV: process.env.NODE_ENV ?? 'test' })
  nextEnv.loadEnvConfig(process.cwd())
  await resetTestDatabase(process.env.DATABASE_URL)
}
