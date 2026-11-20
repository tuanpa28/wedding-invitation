import { describe, expect, it } from 'vitest'
import { bankAccountSchema, bankName, toBankName, transferNote, vietQrImageUrl } from '@/lib/gifts'

describe('mừng cưới', () => {
  it('tên chủ tài khoản in hoa không dấu', () => {
    expect(toBankName('Nguyễn Quang Huy')).toBe('NGUYEN QUANG HUY')
    expect(toBankName('Trần Thị Đào')).toBe('TRAN THI DAO')
  })

  it('kiểm tra tài khoản', () => {
    const ok = bankAccountSchema.parse({
      bankBin: '970436',
      accountNumber: ' 0011004455667 ',
      accountName: 'Nguyễn Quang Huy',
    })
    expect(ok).toEqual({
      bankBin: '970436',
      accountNumber: '0011004455667',
      accountName: 'NGUYEN QUANG HUY',
    })
    expect(bankAccountSchema.safeParse({ ...ok, bankBin: '' }).success).toBe(false)
    expect(bankAccountSchema.safeParse({ ...ok, accountNumber: '12 34' }).success).toBe(false)
  })

  it('nội dung chuyển khoản không dấu, gọn', () => {
    expect(transferNote('Anh Nam', 'Quang Huy', 'Thu Hà')).toBe('ANH NAM MUNG CUOI HUY HA')
    expect(transferNote(undefined, 'Quang Huy', 'Thu Hà')).toBe('MUNG CUOI HUY HA')
    expect(
      transferNote('Cô Hoa và gia đình chú Ba ở quê', 'Quang Huy', 'Thu Hà').length,
    ).toBeLessThanOrEqual(50)
  })

  it('link ảnh VietQR', () => {
    const url = vietQrImageUrl(
      { bankBin: '970436', accountNumber: '0011004455667', accountName: 'NGUYEN QUANG HUY' },
      'MUNG CUOI HUY HA',
    )
    expect(url).toBe(
      'https://img.vietqr.io/image/970436-0011004455667-compact2.png?accountName=NGUYEN+QUANG+HUY&addInfo=MUNG+CUOI+HUY+HA',
    )
    expect(bankName('970436')).toBe('Vietcombank')
  })
})
