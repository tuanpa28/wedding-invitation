import { afterEach, describe, expect, it, vi } from 'vitest'
import { POST as signUploadRoute } from '@/app/api/uploads/sign/route'
import { PATCH as patchWedding, GET as getWedding } from '@/app/api/weddings/[id]/route'
import { POST as createWeddingRoute, GET as listWeddings } from '@/app/api/weddings/route'
import { signCloudinaryParams } from '@/server/services/uploads'
import { createUser, randomSlug } from './helpers'

// Thay Better Auth bằng session giả: header x-test-user chứa id user đang đăng nhập
vi.mock('@/server/auth', () => ({
  getAuth: () => ({
    api: {
      getSession: async ({ headers }: { headers: Headers }) => {
        const id = headers.get('x-test-user')
        return id
          ? { user: { id, name: 'Test', email: `${id}@thiephong.test`, image: null, role: 'user' } }
          : null
      },
    },
  }),
}))

function request(
  path: string,
  {
    method = 'GET',
    user,
    body,
    contentType = 'application/json',
  }: {
    method?: string
    user?: string
    body?: unknown
    contentType?: string
  } = {},
) {
  const headers = new Headers()
  if (user) headers.set('x-test-user', user)
  if (body !== undefined) headers.set('content-type', contentType)
  return new Request(`http://localhost${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

const ctx = (id: string) => ({ params: Promise.resolve({ id }) })

async function createViaApi(userId: string) {
  const res = await createWeddingRoute(
    request('/api/weddings', {
      method: 'POST',
      user: userId,
      body: { groomName: 'Minh', brideName: 'Lan', slug: randomSlug(), templateId: 'song-hy' },
    }),
    undefined,
  )
  expect(res.status).toBe(201)
  return ((await res.json()) as { wedding: { id: string } }).wedding.id
}

describe('API dashboard', () => {
  it('chưa đăng nhập → 401', async () => {
    const res = await listWeddings(request('/api/weddings'), undefined)
    expect(res.status).toBe(401)
    expect(await res.json()).toMatchObject({ error: 'unauthorized' })
  })

  it('user B sửa thiệp của user A → 404, dữ liệu không đổi', async () => {
    const a = await createUser()
    const b = await createUser()
    const id = await createViaApi(a.id)

    const res = await patchWedding(
      request(`/api/weddings/${id}`, { method: 'PATCH', user: b.id, body: { quote: 'Hack' } }),
      ctx(id),
    )
    expect(res.status).toBe(404)

    const own = await getWedding(request(`/api/weddings/${id}`, { user: a.id }), ctx(id))
    expect(((await own.json()) as { wedding: { quote: string | null } }).wedding.quote).toBeNull()
  })

  it('dữ liệu sai → 400 kèm thông báo tiếng Việt', async () => {
    const a = await createUser()
    const id = await createViaApi(a.id)
    const res = await patchWedding(
      request(`/api/weddings/${id}`, {
        method: 'PATCH',
        user: a.id,
        body: { slug: 'Có Dấu Cách', cover: { src: 'https://evil.example/x.jpg' } },
      }),
      ctx(id),
    )
    expect(res.status).toBe(400)
    const data = (await res.json()) as { error: string; issues: { path: string }[] }
    expect(data.error).toBe('invalid')
    expect(data.issues.map((i) => i.path)).toEqual(expect.arrayContaining(['slug', 'cover.src']))
  })

  it('form thông tin lưu được và xoá được câu trích dẫn', async () => {
    const a = await createUser()
    const id = await createViaApi(a.id)
    const patch = (body: unknown) =>
      patchWedding(request(`/api/weddings/${id}`, { method: 'PATCH', user: a.id, body }), ctx(id))

    const person = (name: string) => ({ fullName: name, shortName: name, father: '', mother: '' })
    const form = {
      slug: undefined,
      templateId: 'hoa-co',
      groom: person('Minh'),
      bride: { ...person('Lan'), father: 'Ông Trần Văn Bình' },
      quote: 'Trăm năm',
    }
    expect((await patch(form)).status).toBe(200)
    // Chuỗi rỗng và null đều xoá câu trích dẫn
    expect((await patch({ quote: '' })).status).toBe(200)
    expect((await patch({ quote: null })).status).toBe(200)

    const res = await getWedding(request(`/api/weddings/${id}`, { user: a.id }), ctx(id))
    const { wedding } = (await res.json()) as {
      wedding: { quote: string | null; templateId: string; bride: Record<string, string> }
    }
    expect(wedding.quote).toBeNull()
    expect(wedding.templateId).toBe('hoa-co')
    expect(wedding.bride).toEqual({
      fullName: 'Lan',
      shortName: 'Lan',
      father: 'Ông Trần Văn Bình',
    })
  })

  it('không phải JSON → 415 (chặn form chéo trang)', async () => {
    const a = await createUser()
    const id = await createViaApi(a.id)
    const res = await patchWedding(
      request(`/api/weddings/${id}`, {
        method: 'PATCH',
        user: a.id,
        body: { quote: 'x' },
        contentType: 'text/plain',
      }),
      ctx(id),
    )
    expect(res.status).toBe(415)
  })
})

describe('ký upload Cloudinary', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('chữ ký đúng ví dụ trong tài liệu Cloudinary', () => {
    expect(
      signCloudinaryParams(
        {
          eager: 'w_400,h_300,c_pad|w_260,h_200,c_crop',
          public_id: 'sample_image',
          timestamp: 1315060510,
        },
        'abcd',
      ),
    ).toBe('bfd09f95f331f558cbd1320e67aa8d488770583e')
  })

  it('chưa cấu hình → 503; có cấu hình → ký đúng thư mục của thiệp', async () => {
    const a = await createUser()
    const id = await createViaApi(a.id)
    const sign = () =>
      signUploadRoute(
        request('/api/uploads/sign', {
          method: 'POST',
          user: a.id,
          body: { weddingId: id, kind: 'image' },
        }),
        undefined,
      )

    vi.stubEnv('CLOUDINARY_CLOUD_NAME', '')
    expect((await sign()).status).toBe(503)

    vi.stubEnv('CLOUDINARY_CLOUD_NAME', 'demo-cloud')
    vi.stubEnv('CLOUDINARY_API_KEY', '123')
    vi.stubEnv('CLOUDINARY_API_SECRET', 'secret')
    const res = await sign()
    expect(res.status).toBe(200)
    const data = (await res.json()) as { uploadUrl: string; fields: Record<string, string> }
    expect(data.uploadUrl).toBe('https://api.cloudinary.com/v1_1/demo-cloud/image/upload')
    expect(data.fields.folder).toBe(`thiephong/${id}`)
    const { signature, api_key, ...signed } = data.fields
    expect(api_key).toBe('123')
    expect(signature).toBe(signCloudinaryParams(signed, 'secret'))
  })

  it('người ngoài không xin được chữ ký upload vào thiệp của người khác', async () => {
    const a = await createUser()
    const b = await createUser()
    const id = await createViaApi(a.id)
    vi.stubEnv('CLOUDINARY_CLOUD_NAME', 'demo-cloud')
    vi.stubEnv('CLOUDINARY_API_KEY', '123')
    vi.stubEnv('CLOUDINARY_API_SECRET', 'secret')
    const res = await signUploadRoute(
      request('/api/uploads/sign', {
        method: 'POST',
        user: b.id,
        body: { weddingId: id, kind: 'image' },
      }),
      undefined,
    )
    expect(res.status).toBe(404)
  })
})
