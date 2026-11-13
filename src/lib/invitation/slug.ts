/** Bỏ dấu tiếng Việt và ký tự lạ: "Ngọc Lan" → "ngoc-lan" */
export function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Gợi ý đường dẫn từ tên gọi: "Minh Tuấn" + "Ngọc Lan" → "tuan-lan" (tên chính là từ cuối) */
export function suggestSlug(groomName: string, brideName: string) {
  const lastWord = (name: string) => slugify(name).split('-').filter(Boolean).at(-1) ?? ''
  return [lastWord(groomName), lastWord(brideName)].filter(Boolean).join('-')
}

const VN_OFFSET = '+07:00'

/** "2027-01-09T10:30" (ô datetime-local, giờ Việt Nam) → ISO có múi giờ */
export function vnLocalToIso(local: string) {
  return local ? `${local}:00${VN_OFFSET}` : ''
}

/** ISO → "2027-01-09T10:30" theo giờ Việt Nam (UTC+7, không có giờ mùa hè) */
export function isoToVnLocal(iso: string) {
  if (!iso) return ''
  const shifted = new Date(Date.parse(iso) + 7 * 60 * 60 * 1000)
  return shifted.toISOString().slice(0, 16)
}
