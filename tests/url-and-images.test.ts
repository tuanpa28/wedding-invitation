import { describe, expect, it } from 'vitest'
import imageLoader from '@/lib/image-loader'
import { guestCodeFromPath, isValidGuestCode } from '@/lib/invitation/validation'

describe('mã khách trong link /m/<mã>', () => {
  it('đọc đúng mã', () => {
    expect(guestCodeFromPath('/m/nam2027')).toBe('nam2027')
    expect(guestCodeFromPath('/m/a8Kx_2-pQ/')).toBe('a8Kx_2-pQ')
  })

  it('link sai trả null', () => {
    for (const path of [
      '/',
      '/m',
      '/m/',
      '/m/ab',
      '/m/có-dấu',
      '/m/a/b',
      '/m/%E0%A4%A',
      '/x/nam2027',
    ]) {
      expect(guestCodeFromPath(path), path).toBeNull()
    }
  })

  it('định dạng mã', () => {
    expect(isValidGuestCode('nam2027')).toBe(true)
    expect(isValidGuestCode('a'.repeat(33))).toBe(false)
    expect(isValidGuestCode('../x')).toBe(false)
  })
})

describe('loader ảnh', () => {
  it('ảnh Cloudinary được resize theo bề rộng', () => {
    expect(
      imageLoader({
        src: 'https://res.cloudinary.com/demo/image/upload/v1/thiephong/a.jpg',
        width: 640,
      }),
    ).toBe(
      'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_640/v1/thiephong/a.jpg',
    )
  })

  it('ảnh trong public/ giữ nguyên', () => {
    expect(imageLoader({ src: '/demo/cover.jpg', width: 640 })).toBe('/demo/cover.jpg')
  })
})
