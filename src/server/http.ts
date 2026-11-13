import 'server-only'
import { unstable_rethrow } from 'next/navigation'
import { connection } from 'next/server'
import { z } from 'zod'

/** Lỗi có mã HTTP, được route() đổi thành JSON { error, message } */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

export const notFoundError = () => new HttpError(404, 'not_found', 'Không tìm thấy thiệp')

/**
 * Bọc route handler: lỗi nghiệp vụ → JSON đúng mã, lỗi lạ → 500 không lộ chi tiết.
 * Mọi API đều theo người dùng/request → luôn chạy lúc request (không prerender lúc build).
 */
export function route<Ctx>(handler: (request: Request, ctx: Ctx) => Promise<Response>) {
  return async (request: Request, ctx: Ctx): Promise<Response> => {
    await connection()
    try {
      return await handler(request, ctx)
    } catch (error) {
      // Lỗi điều khiển nội bộ của Next.js (prerender, redirect, ...) phải được ném tiếp
      unstable_rethrow(error)
      if (error instanceof HttpError) {
        return Response.json(
          { error: error.code, message: error.message },
          { status: error.status },
        )
      }
      if (error instanceof z.ZodError) {
        return Response.json(
          {
            error: 'invalid',
            message: error.issues[0]?.message ?? 'Dữ liệu không hợp lệ',
            issues: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
          },
          { status: 400 },
        )
      }
      console.error(error)
      return Response.json(
        { error: 'internal', message: 'Có lỗi xảy ra, vui lòng thử lại' },
        { status: 500 },
      )
    }
  }
}

/**
 * Đọc body JSON và kiểm tra bằng zod. Bắt buộc Content-Type application/json:
 * form chéo trang không gửi được kiểu này nếu không qua CORS preflight (chống CSRF).
 */
export async function readJson<S extends z.ZodType>(request: Request, schema: S) {
  if (!request.headers.get('content-type')?.includes('application/json')) {
    throw new HttpError(415, 'unsupported_media_type', 'Cần gửi dữ liệu dạng JSON')
  }
  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw new HttpError(400, 'invalid_json', 'Dữ liệu gửi lên không đọc được')
  }
  return schema.parse(body) as z.infer<S>
}
