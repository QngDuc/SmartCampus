import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen, Button } from '@/components/campus-ui';
import { colors, s } from '@/constants/campus';
import { locations } from '@/data/mockData';

import { showAlert } from '@/utils/feedback';

export default function MapScreen() {
  const [searchText, setSearchText] = useState('');
  // Lọc theo tên; không phân biệt chữ hoa và chữ thường.
  const results = locations.filter(item => item.name.toLowerCase().includes(searchText.trim().toLowerCase()));
  return <Screen>
    <Text style={s.badge}>KHÁM PHÁ TRƯỜNG HỌC</Text>
    <Text style={s.title}>Bản đồ khuôn viên</Text>
    <TextInput accessibilityLabel="Tìm địa điểm" style={s.input} placeholder="Tìm thư viện, giảng đường..." placeholderTextColor={colors.muted} value={searchText} onChangeText={setSearchText} />
    <View style={s.placeholder}>
      <Ionicons name="map-outline" size={60} color={colors.primary} />
      <Text style={[s.heading, s.center]}>Bản đồ khuôn viên</Text>
      <Text style={[s.muted, s.center]}>Chức năng bản đồ sẽ được tích hợp sau</Text>
      <Text style={s.badge}>BẢN ĐỒ MÔ PHỎNG</Text>
    </View>
    <Button title="Vị trí của tôi" onPress={() => {
      // Sau này có thể tích hợp expo-location tại đây
      showAlert('Mô phỏng vị trí', 'Đã xác định vị trí hiện tại của bạn!');
    }} />
    <Text style={s.heading}>Địa điểm nổi bật</Text>
    {results.length === 0 && <View style={s.card}><Text style={s.text}>Không tìm thấy địa điểm phù hợp.</Text><Text style={s.muted}>Thử tìm “Thư viện” hoặc “Giảng đường”.</Text></View>}
    {results.map(item => <Pressable accessibilityRole="button" key={item.id} style={s.card}
      onPress={() => router.push({ pathname: '/location-detail', params: { id: item.id } })}>
      <Text style={s.badge}>{item.category}</Text><Text style={s.heading}>{item.name}</Text>
      <Text style={s.muted}>{item.description}</Text><Text style={s.link}>Xem chi tiết →</Text>
    </Pressable>)}
  </Screen>;
}

