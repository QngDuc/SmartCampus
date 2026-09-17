import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen, Button } from '@/components/campus-ui';
import { colors, s } from '@/constants/campus';
import { locations } from '@/data/mockData';

import { approximateLocationIds, getDirectionsDestination } from '@/data/campusMap';
import { openDirections } from '@/utils/directions';

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
    <Button title="Xem trên bản đồ" onPress={() => router.push({ pathname: '/(tabs)/map', params: { locationId: String(location.id) } })} />
    {approximateLocationIds.has(location.id) && <Text style={s.muted}>Ghim trên bản đồ được ước lượng từ sơ đồ trường. Khi dẫn đường, Google Maps sẽ tìm điểm đến theo tên; hãy kiểm tra kết quả trước khi đi.</Text>}
    <Button title="Dẫn đường" secondary onPress={() => openDirections(getDirectionsDestination(location.id, location.name))} />
  </Screen>;
}

