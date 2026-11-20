import { toast } from 'sonner'

/** Chép vào clipboard rồi báo kết quả. Trả về true nếu chép được. */
export async function copyText(text: string, done: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(done)
    return true
  } catch {
    toast.error('Không chép được, hãy chọn và chép tay')
    return false
  }
}

/**
 * Mở bảng chia sẻ của máy (điện thoại: chọn Zalo, Messenger…). Trả về true nếu đã chia sẻ;
 * người dùng đóng bảng chia sẻ thì trả về false, không báo lỗi.
 */
export async function shareText(text: string) {
  try {
    await navigator.share({ text })
    return true
  } catch (error) {
    if ((error as Error).name !== 'AbortError') toast.error('Không mở được bảng chia sẻ')
    return false
  }
}

export const canShare = () => typeof navigator !== 'undefined' && 'share' in navigator
