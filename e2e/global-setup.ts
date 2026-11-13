import { resetTestDatabase } from '../tests/reset-db'
import { E2E_DATABASE_URL } from './env'

/** Playwright: reset database test trước khi chạy E2E */
export default async function setup() {
  await resetTestDatabase(E2E_DATABASE_URL)
}
