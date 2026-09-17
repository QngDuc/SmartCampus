import { Linking } from 'react-native';
import { isValidCoordinate, type Coordinate } from '@/data/campusMap';
import { showAlert } from '@/utils/feedback';

export async function openDirections(destination: Coordinate | string | undefined) {
  if (typeof destination !== 'string' && !isValidCoordinate(destination)) {
    showAlert('Chưa có vị trí', 'Địa điểm này chưa có tọa độ chính xác để dẫn đường.');
    return;
  }
  // Bỏ origin để Google Maps lấy vị trí hiện tại, kể cả khi app chưa được cấp GPS.
  const target = encodeURIComponent(typeof destination === 'string' ? destination : `${destination.latitude},${destination.longitude}`);
  try {
    // Đích theo tên cần người dùng kiểm tra kết quả trước khi bắt đầu dẫn đường.
    const navigate = typeof destination === 'string' ? '' : '&dir_action=navigate';
    await Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${target}&travelmode=walking${navigate}`);
  } catch {
    showAlert('Không mở được dẫn đường', 'Hãy kiểm tra kết nối hoặc ứng dụng Google Maps rồi thử lại.');
  }
}
