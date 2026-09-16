import { useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen, Button } from '@/components/campus-ui';
import { colors, s } from '@/constants/campus';
import { events } from '@/data/mockData';

import { showAlert } from '@/utils/feedback';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = events.find(item => String(item.id) === id);
  const [registered, setRegistered] = useState(false);
  if (!event) return <Screen back><Text style={s.heading}>Không tìm thấy sự kiện.</Text></Screen>;
  function register() {
    if (registered) return;
    setRegistered(true);
    showAlert('Thành công', 'Đăng ký sự kiện thành công!');
  }
  return <Screen back>
    <View style={s.placeholder}><Ionicons name="ticket-outline" size={64} color={colors.primary} /><Text style={s.badge}>CÙNG NHAU TRẢI NGHIỆM</Text></View>
    <Text style={s.title}>{event.title}</Text>
    <View style={s.card}>
      <Text style={s.text}>Ngày: {event.date}</Text><Text style={s.text}>Giờ: {event.time}</Text><Text style={s.text}>Địa điểm: {event.location}</Text>
    </View>
    <Text style={s.heading}>Giới thiệu sự kiện</Text><Text style={s.text}>{event.description}</Text>
    {/* State đổi nhãn nút và chặn đăng ký lặp trong màn hình hiện tại. */}
    <Button title={registered ? 'Đã đăng ký' : 'Đăng ký tham gia'} onPress={register} disabled={registered} />
  </Screen>;
}

