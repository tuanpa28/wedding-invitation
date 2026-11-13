import { Hono } from 'hono'
import { health } from './routes/health'
import type { AppEnv } from './types'

export const app = new Hono<AppEnv>().basePath('/api').route('/health', health)

app.notFound((c) => c.json({ error: 'not_found' }, 404))

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'internal_error' }, 500)
})
