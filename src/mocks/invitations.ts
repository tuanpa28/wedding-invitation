import type { Guest, Invitation, Photo } from '@/lib/invitation/types'

// Thiệp mẫu: seed vào Firestore (npm run seed) và dùng làm fixture cho test.

const photo = (file: string, width: number, height: number, alt: string): Photo => ({
  src: `/demo/${file}`,
  width,
  height,
  alt,
})

const MUSIC_URL =
  'https://upload.wikimedia.org/wikipedia/commons/1/12/Canon_%282004%29_-_Strolling_Strings_-_United_States_Air_Force_Band.mp3'

export const demoInvitation: Invitation = {
  slug: 'demo',
  templateId: 'song-hy',
  quote: 'Hai người cùng nhìn về một hướng, mỗi ngày đều là ngày mới.',
  groom: {
    fullName: 'Nguyễn Minh Tuấn',
    shortName: 'Minh Tuấn',
    title: 'Trưởng nam',
    father: 'Ông Nguyễn Văn Hùng',
    mother: 'Bà Lê Thị Mai',
    address: 'Số 7 phố Hàng Bè, Hoàn Kiếm, Hà Nội',
    photo: photo('groom.jpg', 960, 640, 'Chú rể Minh Tuấn cầm bó hoa'),
  },
  bride: {
    fullName: 'Trần Ngọc Lan',
    shortName: 'Ngọc Lan',
    title: 'Thứ nữ',
    father: 'Ông Trần Văn Bình',
    mother: 'Bà Phạm Thị Thu',
    address: 'Số 12 ngõ 45 Trần Hưng Đạo, TP. Nam Định',
    photo: photo('bride.jpg', 960, 1438, 'Cô dâu Ngọc Lan với bó hoa cưới'),
  },
  cover: photo('cover.jpg', 960, 1440, 'Cô dâu và chú rể ôm nhau dưới tán cây'),
  events: [
    {
      id: 'tiec-nha-gai',
      side: 'bride',
      type: 'tiec_cuoi',
      title: 'Tiệc cưới nhà gái',
      startAt: '2027-01-08T17:30:00+07:00',
      venue: 'Nhà hàng Hoa Sen',
      address: '88 Lê Hồng Phong, TP. Nam Định',
      lunarText: 'Tức ngày mùng 1 tháng Chạp năm Bính Ngọ',
    },
    {
      id: 'le-vu-quy',
      side: 'bride',
      type: 'vu_quy',
      title: 'Lễ Vu Quy',
      startAt: '2027-01-09T08:30:00+07:00',
      venue: 'Tư gia nhà gái',
      address: 'Số 12 ngõ 45 Trần Hưng Đạo, TP. Nam Định',
      lunarText: 'Tức ngày mùng 2 tháng Chạp năm Bính Ngọ',
    },
    {
      id: 'le-thanh-hon',
      side: 'groom',
      type: 'thanh_hon',
      title: 'Lễ Thành Hôn',
      startAt: '2027-01-09T10:30:00+07:00',
      venue: 'Tư gia nhà trai',
      address: 'Số 7 phố Hàng Bè, Hoàn Kiếm, Hà Nội',
      lunarText: 'Tức ngày mùng 2 tháng Chạp năm Bính Ngọ',
    },
    {
      id: 'tiec-nha-trai',
      side: 'groom',
      type: 'tiec_cuoi',
      title: 'Tiệc cưới nhà trai',
      startAt: '2027-01-09T11:30:00+07:00',
      venue: 'Trung tâm tiệc cưới Thanh Trì',
      address: '36 Đường Láng, Đống Đa, Hà Nội',
      lunarText: 'Tức ngày mùng 2 tháng Chạp năm Bính Ngọ',
    },
  ],
  gallery: [
    photo('g-01.jpg', 960, 640, 'Cô dâu chú rể nắm tay đi dạo'),
    photo('g-03.jpg', 960, 1440, 'Hồ nước giữa núi, nơi hai người từng đi trốn cuối tuần'),
    photo('g-02.jpg', 960, 639, 'Chú rể hôn lên trán cô dâu'),
    photo('g-04.jpg', 960, 641, 'Cô dâu chú rể đi trong rừng'),
    photo('g-05.jpg', 960, 1472, 'Cô dâu với bó hoa'),
    photo('g-06.jpg', 960, 638, 'Cô dâu chú rể trên cây cầu gỗ'),
    photo('g-07.jpg', 960, 640, 'Chú rể nắm tay cô dâu'),
    photo('g-08.jpg', 960, 640, 'Đôi nhẫn cưới'),
    photo('g-09.jpg', 960, 640, 'Cô dâu cười, khăn voan bay trong gió'),
    photo('g-10.jpg', 960, 640, 'Hai người dưới hoàng hôn màu hồng'),
  ],
  musicUrl: MUSIC_URL,
  rsvpDeadline: '2027-01-01',
  // Tài khoản mẫu (không có thật) để xem mục mừng cưới
  gifts: {
    groom: { bankBin: '970436', accountNumber: '0011223344', accountName: 'NGUYEN MINH TUAN' },
    bride: { bankBin: '970418', accountNumber: '5566778899', accountName: 'TRAN NGOC LAN' },
  },
}

export const demoGuests: Guest[] = [
  { code: 'nam2027', side: 'groom', displayName: 'Anh Nam' },
  { code: 'cohoa27', side: 'bride', displayName: 'Cô Hoa và gia đình' },
]
