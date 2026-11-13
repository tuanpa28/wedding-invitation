// Mọi request /api/* trên Cloudflare Pages đi vào Hono app
import { handle } from 'hono/cloudflare-pages'
import { app } from '../../server/app'

export const onRequest = handle(app)
