import { describe, expect, it } from 'vitest'
import { bankAccountSchema, bankName, toBankName, transferNote, vietQrImageUrl } from '@/lib/gifts'

describe('mừng cưới', () => {
  it('tên chủ tài khoản in hoa không dấu', () => {
    expect(toBankName('Nguyễn Minh Tuấn')).toBe('NGUYEN MINH TUAN')
    expect(toBankName('Trần Thị Đào')).toBe('TRAN THI DAO')
  })

  it('kiểm tra tài khoản', () => {
    const ok = bankAccountSchema.parse({
      bankBin: '970436',
      accountNumber: ' 0011004455667 ',
      accountName: 'Nguyễn Minh Tuấn',
    })
    expect(ok).toEqual({
      bankBin: '970436',
      accountNumber: '0011004455667',
      accountName: 'NGUYEN MINH TUAN',
    })
    expect(bankAccountSchema.safeParse({ ...ok, bankBin: '' }).success).toBe(false)
    expect(bankAccountSchema.safeParse({ ...ok, accountNumber: '12 34' }).success).toBe(false)
  })

  it('nội dung chuyển khoản không dấu, gọn', () => {
    expect(transferNote('Anh Nam', 'Minh Tuấn', 'Ngọc Lan')).toBe('ANH NAM MUNG CUOI TUAN LAN')
    expect(transferNote(undefined, 'Minh Tuấn', 'Ngọc Lan')).toBe('MUNG CUOI TUAN LAN')
    expect(
      transferNote('Cô Hoa và gia đình chú Ba ở quê', 'Minh Tuấn', 'Ngọc Lan').length,
    ).toBeLessThanOrEqual(50)
  })

  it('link ảnh VietQR', () => {
    const url = vietQrImageUrl(
      { bankBin: '970436', accountNumber: '0011004455667', accountName: 'NGUYEN MINH TUAN' },
      'MUNG CUOI TUAN LAN',
    )
    expect(url).toBe(
      'https://img.vietqr.io/image/970436-0011004455667-compact2.png?accountName=NGUYEN+MINH+TUAN&addInfo=MUNG+CUOI+TUAN+LAN',
    )
    expect(bankName('970436')).toBe('Vietcombank')
  })
})
