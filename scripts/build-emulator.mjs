// Build site tĩnh trỏ vào Firebase Emulator (dùng cho npm run preview).
// Biến môi trường của tiến trình được ưu tiên hơn file .env, nên .env (project thật) không bị dùng.
import { spawnSync } from 'node:child_process'
import './clear-fetch-cache.mjs'

const result = spawnSync('npx', ['next', 'build'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NEXT_PUBLIC_FIREBASE_EMULATOR: 'true' },
})
process.exit(result.status ?? 1)
