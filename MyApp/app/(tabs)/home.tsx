import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/campus-ui';
import { s } from '@/constants/campus';
import { notifications } from '@/data/mockData';
import { formatNoticeDate, useSchoolNotices } from '@/hooks/use-school-notices';

export default function HomeScreen() {
  const { notices, loading, error, retry } = useSchoolNotices();

  return <Screen>
    <View style={s.between}>
      <View style={s.grow}><Text style={s.badge}>SMART CAMPUS</Text><Text style={s.heading}>Xin chào, Sinh viên</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Mở hồ sơ cá nhân" style={s.avatar} onPress={() => router.navigate('/(tabs)/profile')}><Text style={s.link}>NA</Text></Pressable>
    </View>
    <View style={s.hero}>
      <Text style={[s.badge, { color: '#BFDBFE' }]}>KHUÔN VIÊN CỦA BẠN</Text>
      <Text style={[s.title, s.white]}>Chào mừng đến với Smart Campus</Text>
      <Text style={[s.text, s.white]}>Lịch học, thông báo từ trường và những điểm đến — tất cả trong tầm tay.</Text>
    </View>
    <Text style={s.badge}>TIỆN ÍCH NHANH</Text>
    {/* Flexbox row và wrap chia các tiện ích thành hai cột. */}
    <View style={s.grid}>
      <Pressable accessibilityRole="button" style={[s.card, s.tile]} onPress={() => router.navigate('/(tabs)/map')}><Text style={s.badge}>01 / KHÁM PHÁ</Text><Text style={s.heading}>Bản đồ ↗</Text></Pressable>
      <Pressable accessibilityRole="button" style={[s.card, s.tile]} onPress={() => router.navigate('/(tabs)/schedule')}><Text style={s.badge}>02 / HỌC TẬP</Text><Text style={s.heading}>Lịch & điểm ↗</Text></Pressable>
      <Pressable accessibilityRole="button" style={[s.card, s.tile]} onPress={() => router.navigate('/(tabs)/events')}><Text style={s.badge}>03 / TỪ NHÀ TRƯỜNG</Text><Text style={s.heading}>Thông báo trường ↗</Text></Pressable>
      <Pressable accessibilityRole="button" style={[s.card, s.tile]} onPress={() => router.push('/notifications')}><Text style={s.badge}>04 / CẬP NHẬT</Text><Text style={s.heading}>Thông báo ↗</Text></Pressable>
    </View>
    <Text style={s.heading}>Thông báo mới từ trường</Text>
    {loading && <ActivityIndicator accessibilityLabel="Đang tải thông báo" />}
    {error && <Pressable accessibilityRole="button" onPress={retry}><Text style={s.link}>Không tải được thông báo. Thử lại</Text></Pressable>}
    {!loading && !error && notices.slice(0, 2).map(notice => <Pressable accessibilityRole="link" key={notice.id} style={s.card} onPress={() => void Linking.openURL(notice.url)}>
      {!!notice.publishedAt && <Text style={s.badge}>{formatNoticeDate(notice.publishedAt)}</Text>}
      <Text style={s.heading}>{notice.title}</Text>
      {!!notice.description && <Text style={s.text}>{notice.description}</Text>}
      <Text style={s.link}>Đọc trên website trường →</Text>
    </Pressable>)}
    <Text style={s.heading}>Nhắc nhở trong ứng dụng</Text>
    {notifications.slice(0, 2).map(item => <Pressable accessibilityRole="button" key={item.id} style={s.card} onPress={() => router.push('/notifications')}>
      <Text style={s.heading}>{item.title}</Text><Text style={s.text}>{item.content}</Text><Text style={s.muted}>{item.time}</Text>
    </Pressable>)}
  </Screen>;
}

