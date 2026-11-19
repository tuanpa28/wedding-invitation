import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Test logic thuần (không cần emulator). Test Security Rules: vitest.rules.config.mts
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/rules/**'],
    environment: 'node',
  },
})
