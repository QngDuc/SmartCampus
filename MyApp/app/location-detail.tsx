import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen, Button } from '@/components/campus-ui';
import { colors, s } from '@/constants/campus';
import { locations } from '@/data/mockData';

import { showAlert } from '@/utils/feedback';

export default function LocationDetailScreen() {
  // id được truyền từ card địa điểm; params trên đường dẫn là chuỗi.
  const { id } = useLocalSearchParams<{ id: string }>();
  const location = locations.find(item => String(item.id) === id);
  if (!location) return <Screen back><Text style={s.heading}>Không tìm thấy địa điểm.</Text></Screen>;
  return <Screen back>
    <View style={s.placeholder}><Ionicons name="business-outline" size={64} color={colors.primary} /><Text style={s.badge}>KHÔNG GIAN KHUÔN VIÊN</Text></View>
    <Text style={s.title}>{location.name}</Text>
    <Text style={s.badge}>{location.category}</Text>
    <View style={s.card}><Text style={s.heading}>Giờ hoạt động</Text><Text style={s.text}>{location.hours}</Text><Text style={s.muted}>Giờ hoạt động tham khảo</Text></View>
    <Text style={s.heading}>Về địa điểm</Text><Text style={s.text}>{location.description}</Text>
    {/* Sau này tích hợp GPS và bản đồ tại đây */}
    <Button title="Xem trên bản đồ" onPress={() => showAlert('Mô phỏng bản đồ', 'Đang hiển thị địa điểm trên bản đồ.')} />
    <Button title="Chỉ đường" secondary onPress={() => showAlert('Chỉ đường', 'Chức năng chỉ đường sẽ được tích hợp sau.')} />
  </Screen>;
}

