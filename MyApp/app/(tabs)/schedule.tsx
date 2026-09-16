import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Screen, Button } from '@/components/campus-ui';
import { s } from '@/constants/campus';
import { days, schedules } from '@/data/mockData';

import { showAlert } from '@/utils/feedback';

export default function ScheduleScreen() {
  const [selectedDay, setSelectedDay] = useState('Thứ 2');
  const [reminders, setReminders] = useState<number[]>([]);
  // Lọc lịch học theo ngày được chọn.
  const lessons = schedules.filter(item => item.day === selectedDay);
  function remind(id: number) {
    if (reminders.includes(id)) return;
    setReminders([...reminders, id]);
    // Sau này có thể tích hợp expo-notifications tại đây
    showAlert('Nhắc lịch mô phỏng', 'Đã bật nhắc lịch cho môn học này!');
  }
  return <Screen>
    <Text style={s.badge}>HỌC TẬP CÁ NHÂN</Text><Text style={s.title}>Lịch học của tôi</Text>
    <Text style={s.muted}>Sắp xếp ngày học, chủ động thời gian.</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
      {days.map(day => <Pressable accessibilityRole="button" accessibilityState={{ selected: selectedDay === day }} key={day} style={[s.day, selectedDay === day && s.selected]} onPress={() => setSelectedDay(day)}>
        <Text style={[s.label, selectedDay === day && s.white]}>{day}</Text>
      </Pressable>)}
    </ScrollView>
    <Text style={s.heading}>{selectedDay} · {lessons.length} môn học</Text>
    {lessons.length === 0 && <View style={s.card}><Text style={s.heading}>Hôm nay không có lịch học</Text><Text style={s.muted}>Dành chút thời gian tự học hoặc khám phá các sự kiện nhé.</Text></View>}
    {lessons.map(item => <View key={item.id} style={s.card}>
      <Text style={s.badge}>{item.time}</Text><Text style={s.heading}>{item.subject}</Text><Text style={s.muted}>Phòng học: {item.room}</Text>
      <Button title={reminders.includes(item.id) ? 'Đã bật nhắc lịch' : 'Nhắc lịch'} secondary disabled={reminders.includes(item.id)} onPress={() => remind(item.id)} />
    </View>)}
  </Screen>;
}

