import type { Guest, Invitation, Photo } from '@/lib/invitation/types'

// Dữ liệu thiệp mẫu: seed vào Postgres (npm run db:seed) và dùng làm fixture cho test.

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
  story: [
    {
      date: 'Tháng 10, 2021',
      title: 'Cơn mưa đầu mùa',
      text: 'Chung một chiếc ô ở bến xe buýt Kim Mã, hai người lạ đi chung đoạn đường dài hơn dự định.',
      photo: photo('story-1.jpg', 960, 640, 'Hai người đi chung một chiếc ô'),
    },
    {
      date: 'Tháng 6, 2023',
      title: 'Chuyến đi Quy Nhơn',
      text: 'Hoàng hôn ở Kỳ Co, lần đầu tiên nói với nhau về một mái nhà chung.',
      photo: photo('story-2.jpg', 960, 1440, 'Hai người trên bãi biển lúc hoàng hôn'),
    },
    {
      date: 'Tháng 2, 2026',
      title: 'Lời cầu hôn',
      text: 'Một chiếc nhẫn giấu trong hộp mứt ngày Tết, và câu trả lời là “Có”.',
      photo: photo('story-3.jpg', 960, 640, 'Cô dâu cầm đôi nhẫn cưới'),
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
}

export const demoGuests: Guest[] = [
  { code: 'nam2027', side: 'groom', displayName: 'Anh Nam' },
  { code: 'cohoa27', side: 'bride', displayName: 'Cô Hoa và gia đình' },
]

/** Cặp thứ hai: tổ chức ở Huế và TP.HCM, cách nhau một tuần, không có nhạc nền */
export const anhThuInvitation: Invitation = {
  slug: 'anh-thu',
  templateId: 'hoa-co',
  quote: 'Từ Huế vào Sài Gòn, cuối cùng cũng về chung một nhà.',
  groom: {
    fullName: 'Lê Hoàng Anh',
    shortName: 'Hoàng Anh',
    title: 'Trưởng nam',
    father: 'Ông Lê Văn Phúc',
    mother: 'Bà Nguyễn Thị Hạnh',
    address: '45 Nguyễn Trãi, Quận 5, TP. Hồ Chí Minh',
    photo: photo('groom.jpg', 960, 640, 'Chú rể Hoàng Anh'),
  },
  bride: {
    fullName: 'Võ Minh Thư',
    shortName: 'Minh Thư',
    title: 'Út nữ',
    father: 'Ông Võ Văn Tâm',
    mother: 'Bà Đặng Thị Lan',
    address: '12 Lê Lợi, TP. Huế',
    photo: photo('bride.jpg', 960, 1438, 'Cô dâu Minh Thư'),
  },
  cover: photo('story-2.jpg', 960, 1440, 'Hai người trên bãi biển lúc hoàng hôn'),
  events: [
    {
      id: 'thu-vu-quy',
      side: 'bride',
      type: 'vu_quy',
      title: 'Lễ Vu Quy',
      startAt: '2027-03-20T08:00:00+07:00',
      venue: 'Tư gia nhà gái',
      address: '12 Lê Lợi, TP. Huế',
    },
    {
      id: 'thu-tiec',
      side: 'bride',
      type: 'tiec_cuoi',
      title: 'Tiệc cưới nhà gái',
      startAt: '2027-03-20T17:00:00+07:00',
      venue: 'Nhà hàng Bên Sông',
      address: '3 Lê Lợi, TP. Huế',
    },
    {
      id: 'anh-thanh-hon',
      side: 'groom',
      type: 'thanh_hon',
      title: 'Lễ Thành Hôn',
      startAt: '2027-03-27T09:00:00+07:00',
      venue: 'Tư gia nhà trai',
      address: '45 Nguyễn Trãi, Quận 5, TP. Hồ Chí Minh',
    },
    {
      id: 'anh-tiec',
      side: 'groom',
      type: 'tiec_cuoi',
      title: 'Tiệc cưới nhà trai',
      startAt: '2027-03-27T18:00:00+07:00',
      venue: 'Trung tâm hội nghị Hoa Mai',
      address: '88 Võ Văn Kiệt, Quận 1, TP. Hồ Chí Minh',
    },
  ],
  story: [
    {
      date: 'Tháng 8, 2022',
      title: 'Chuyến tàu Thống Nhất',
      text: 'Ngồi cạnh nhau 20 tiếng từ Huế vào Sài Gòn, xuống ga thì đã có số điện thoại.',
      photo: photo('story-1.jpg', 960, 640, 'Hai người đi chung một chiếc ô'),
    },
  ],
  gallery: [
    photo('g-06.jpg', 960, 638, 'Cô dâu chú rể trên cây cầu gỗ'),
    photo('g-07.jpg', 960, 640, 'Chú rể nắm tay cô dâu'),
    photo('g-09.jpg', 960, 640, 'Cô dâu cười, khăn voan bay trong gió'),
    photo('g-10.jpg', 960, 640, 'Hai người dưới hoàng hôn màu hồng'),
  ],
}

export const anhThuGuests: Guest[] = [
  { code: 'chimai', side: 'bride', displayName: 'Chị Mai' },
  { code: 'banduc', side: 'groom', displayName: 'Bạn Đức' },
]

/** Thiệp đang soạn (chưa publish): link phải báo "Không tìm thấy thiệp" */
export const draftInvitation: Invitation = {
  ...demoInvitation,
  slug: 'ban-nhap',
  templateId: 'thanh-lich',
  groom: { ...demoInvitation.groom, fullName: 'Phạm Quốc Bảo', shortName: 'Quốc Bảo' },
  bride: { ...demoInvitation.bride, fullName: 'Đỗ Thu Hà', shortName: 'Thu Hà' },
}

export type WeddingFixture = {
  invitation: Invitation
  status: 'draft' | 'published'
  guests: Guest[]
}

/** Dữ liệu seed vào Postgres (npm run db:seed) và dùng cho test */
export const seedWeddings: WeddingFixture[] = [
  { invitation: demoInvitation, status: 'published', guests: demoGuests },
  { invitation: anhThuInvitation, status: 'published', guests: anhThuGuests },
  {
    invitation: draftInvitation,
    status: 'draft',
    guests: [{ code: 'khach1', side: 'groom', displayName: 'Anh Khách' }],
  },
]
