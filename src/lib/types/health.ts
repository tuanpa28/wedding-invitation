/** Kết quả trả về của GET /api/health — dùng chung cho trang chủ và API */
export type HealthResponse = {
  ok: boolean
  app: string
  time: string
  db: { ok: true; latencyMs: number } | { ok: false; error: string }
}
