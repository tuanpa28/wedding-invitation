import 'server-only'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { isDevLoginEnabled, isGoogleConfigured } from './auth-config'
import { getDb } from './db'
import { account, session, user, verification } from './db/schema'

function createAuth() {
  return betterAuth({
    appName: 'Thiệp Hồng',
    // BETTER_AUTH_URL, BETTER_AUTH_SECRET được Better Auth tự đọc từ env
    database: drizzleAdapter(getDb(), {
      provider: 'pg',
      schema: { user, session, account, verification },
    }),
    user: {
      additionalFields: {
        role: { type: 'string', defaultValue: 'user', input: false },
      },
    },
    socialProviders: isGoogleConfigured()
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            prompt: 'select_account',
          },
        }
      : {},
    emailAndPassword: {
      enabled: isDevLoginEnabled(),
      autoSignIn: true,
      minPasswordLength: 8,
    },
    // Production giới hạn /sign-in, /sign-up 3 lần / 10 giây mỗi IP. Tài khoản thử (chỉ máy local,
    // E2E đăng nhập liên tục) thì bỏ giới hạn; trên Vercel dev login luôn tắt nên giới hạn vẫn bật.
    rateLimit: { enabled: !isDevLoginEnabled() && process.env.NODE_ENV === 'production' },
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 ngày
      updateAge: 60 * 60 * 24,
    },
    // nextCookies phải đứng cuối: cho phép auth.api.* set cookie trong route handler
    plugins: [nextCookies()],
  })
}

export type Auth = ReturnType<typeof createAuth>

let auth: Auth | undefined

/** Khởi tạo lười (giống getDb) để `next build` không cần DATABASE_URL. */
export function getAuth(): Auth {
  auth ??= createAuth()
  return auth
}
