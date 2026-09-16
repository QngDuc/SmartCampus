import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen, Button } from '@/components/campus-ui';
import { colors, s } from '@/constants/campus';

import { showAlert } from '@/utils/feedback';

export default function LoginScreen() {
  // State lưu nội dung người dùng nhập.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  function login() {
    if (!email.trim() || !password.trim()) {
      showAlert('Thông báo', 'Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    // Đăng nhập mô phỏng: chỉ kiểm tra input, không gọi API.
    router.replace('/(tabs)/home');
  }
  return <Screen form>
    <View style={[s.hero, { marginTop: 24 }]}>
      <Ionicons name="school-outline" size={48} color={colors.card} />
      <Text style={[s.title, s.white]}>SMART CAMPUS</Text>
      <Text style={[s.text, s.white]}>Kết nối học tập. Khám phá khuôn viên.</Text>
    </View>
    <Text style={s.title}>Đăng nhập</Text>
    <Text style={s.muted}>Chào bạn, cùng bắt đầu một ngày học tập mới!</Text>
    <View style={s.card}>
      <Text style={s.label}>Email</Text>
      <TextInput accessibilityLabel="Email" style={s.input} placeholder="you@student.edu.vn" placeholderTextColor={colors.muted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
      <Text style={s.label}>Mật khẩu</Text>
      <TextInput accessibilityLabel="Mật khẩu" style={s.input} placeholder="Nhập mật khẩu" placeholderTextColor={colors.muted} value={password} onChangeText={setPassword} secureTextEntry />
      <Pressable accessibilityRole="button" onPress={() => showAlert('Quên mật khẩu', 'Chức năng khôi phục mật khẩu sẽ được tích hợp sau.')} style={{ paddingVertical: 10 }}>
        <Text style={[s.link, { textAlign: 'right' }]}>Quên mật khẩu?</Text>
      </Pressable>
      <Button title="Đăng nhập" onPress={login} />
    </View>
    <Pressable accessibilityRole="button" onPress={() => router.push('/register')} style={{ padding: 12 }}>
      <Text style={[s.link, s.center]}>Chưa có tài khoản? Đăng ký</Text>
    </Pressable>
  </Screen>;
}

