import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/campus-ui';
import { s } from '@/constants/campus';
import { events } from '@/data/mockData';

export default function EventsScreen() {
  return <Screen>
    <Text style={s.badge}>KẾT NỐI & TRẢI NGHIỆM</Text><Text style={s.title}>Sự kiện</Text>
    <View style={s.hero}><Text style={[s.heading, s.white]}>Mỗi trải nghiệm, một cơ hội mới</Text><Text style={[s.text, s.white]}>Khám phá những hoạt động sắp diễn ra trong khuôn viên.</Text></View>
    {events.map(event => <Pressable accessibilityRole="button" key={event.id} style={s.card}
      onPress={() => router.push({ pathname: '/event-detail', params: { id: event.id } })}>
      <Text style={s.badge}>{event.date} · {event.time}</Text>
      <Text style={s.heading}>{event.title}</Text>
      <Text style={s.muted}>Địa điểm: {event.location}</Text><Text style={s.link}>Xem chi tiết →</Text>
    </Pressable>)}
  </Screen>;
}

