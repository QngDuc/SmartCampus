import { Alert, Platform, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Button } from '@/components/campus-ui';
import { s } from '@/constants/campus';

export default function ProfileScreen() {
  function finishLogout() {
    router.dismissAll();
    router.replace('/');
  }
  function logout() {
    if (Platform.OS === 'web') {
      if (window.confirm('Bạn có chắc muốn đăng xuất?')) finishLogout();
      return;
    }
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: finishLogout },
    ]);
  }
  return <Screen>
    <Text style={s.badge}>TÀI KHOẢN SINH VIÊN</Text>
    <Text style={s.title}>Hồ sơ cá nhân</Text>
    <View style={[s.card, { alignItems: 'center', paddingVertical: 28 }]}>
      <View accessibilityLabel="Ảnh đại diện Nguyễn Văn A" style={[s.avatar, { width: 80, height: 80, borderRadius: 40 }]}><Text style={s.title}>NA</Text></View>
      <Text style={s.heading}>Nguyễn Văn A</Text>
      <Text style={s.muted}>Sinh viên · CNTT K23</Text>
    </View>
    <View style={s.card}>
      <Text style={s.muted}>Mã số sinh viên</Text><Text style={s.heading}>23103047</Text>
      <Text style={s.muted}>Lớp</Text><Text style={s.text}>CNTT K23</Text>
      <Text style={s.muted}>Email</Text><Text style={s.text}>23103047@student.edu.vn</Text>
    </View>
    <Button title="Đăng xuất" onPress={logout} secondary />
  </Screen>;
}

