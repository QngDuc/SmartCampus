import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { Screen } from '@/components/campus-ui';
import { s } from '@/constants/campus';
import { notifications } from '@/data/mockData';

export default function NotificationsScreen() {
  const [items, setItems] = useState(notifications);
  function markRead(id: number) {
    // Tạo array mới; chỉ đổi thông báo có id được bấm.
    setItems(items.map(item => item.id === id ? { ...item, isRead: true } : item));
  }
  return <Screen back>
    <Text style={s.title}>Thông báo</Text>
    <Text style={s.muted}>{items.filter(item => !item.isRead).length} thông báo chưa đọc</Text>
    {items.map(item => <Pressable accessibilityRole="button" key={item.id} onPress={() => markRead(item.id)} style={[s.card, !item.isRead && s.unread]}>
      <Text style={s.badge}>{item.isRead ? 'ĐÃ ĐỌC' : '● CHƯA ĐỌC'}</Text>
      <Text style={s.heading}>{item.title}</Text><Text style={s.text}>{item.content}</Text><Text style={s.muted}>{item.time}</Text>
    </Pressable>)}
  </Screen>;
}

