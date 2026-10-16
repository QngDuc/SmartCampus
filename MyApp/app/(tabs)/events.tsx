import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native';
import { Screen } from '@/components/campus-ui';
import { s } from '@/constants/campus';
import { formatNoticeDate, useSchoolNotices } from '@/hooks/use-school-notices';

export default function EventsScreen() {
  const { notices, loading, error, retry } = useSchoolNotices();

  return <Screen>
    <Text style={s.badge}>THÔNG BÁO SINH VIÊN</Text>
    <Text style={s.title}>Thông báo</Text>
    <View style={s.hero}>
      <Text style={[s.heading, s.white]}>Cập nhật mới từ nhà trường</Text>
      <Text style={[s.text, s.white]}>Thông báo được lấy từ website chính thức của Trường Đại học Tây Nguyên.</Text>
    </View>

    {loading && <ActivityIndicator accessibilityLabel="Đang tải thông báo" />}
    {error && <View style={s.card}>
      <Text style={s.text}>Chưa tải được thông báo. Kiểm tra API rồi thử lại.</Text>
      <Pressable accessibilityRole="button" onPress={retry}><Text style={s.link}>Tải lại</Text></Pressable>
    </View>}
    {!loading && !error && notices.length === 0 && <Text style={s.muted}>Website trường chưa có thông báo nào.</Text>}

    {notices.map(notice => {
      const date = formatNoticeDate(notice.publishedAt);
      return <Pressable accessibilityRole="link" key={notice.id} style={s.card} onPress={() => void Linking.openURL(notice.url)}>
        {!!date && <Text style={s.badge}>{date}</Text>}
        <Text style={s.heading}>{notice.title}</Text>
        {!!notice.description && <Text style={s.text}>{notice.description}</Text>}
        <Text style={s.link}>Đọc trên website trường →</Text>
      </Pressable>;
    })}
  </Screen>;
}
