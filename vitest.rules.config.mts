import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Test firestore.rules trên Firestore Emulator. Chạy qua: npm run test:rules
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['tests/rules/**/*.test.ts'],
    environment: 'node',
    fileParallelism: false,
    testTimeout: 20_000,
  },
})
