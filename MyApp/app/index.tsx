import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen, Button } from '@/components/campus-ui';
import { colors, s as baseStyles } from '@/constants/campus';
import { useAdaptiveStyles } from '@/components/theme-provider';

import { showAlert } from '@/utils/feedback';
import { useAuth } from '@/components/auth-provider';
import { loginUser } from '@/utils/auth';
import { AuthLoadingOverlay } from '@/components/auth-loading-overlay';
import { describeSync } from '@/utils/academic';

export default function LoginScreen() {
  const s = useAdaptiveStyles(baseStyles);
  const { signIn } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function login() {
    if (!identifier.trim() || !password.trim()) {
      showAlert('Thông báo', 'Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    setIsSubmitting(true);
    try {
      const session = await loginUser({ identifier: identifier.trim(), password });
      const summary = await signIn(session);
      router.replace('/(tabs)/home');
      setTimeout(() => showAlert('Đăng nhập thành công', describeSync(summary)), 150);
    } catch (error) {
      showAlert('Đăng nhập thất bại', error instanceof Error ? error.message : 'Đã xảy ra lỗi.');
    } finally {
      setIsSubmitting(false);
    }
  }
  return <Screen form>
    <AuthLoadingOverlay visible={isSubmitting} title="Đang đăng nhập" />
    <View style={[s.hero, { marginTop: 24 }]}>
      <Ionicons name="school-outline" size={48} color={colors.card} />
      <Text style={[s.title, s.white]}>SMART CAMPUS</Text>
      <Text style={[s.text, s.white]}>Kết nối học tập. Khám phá khuôn viên.</Text>
    </View>
    <Text style={s.title}>Đăng nhập</Text>
    <Text style={s.muted}>Chào bạn, cùng bắt đầu một ngày học tập mới!</Text>
    <View style={s.card}>
      <Text style={s.label}>Email hoặc mã sinh viên</Text>
      <TextInput accessibilityLabel="Email hoặc mã sinh viên" style={s.input} placeholder="Email hoặc MSSV 8 chữ số" placeholderTextColor={colors.muted} value={identifier} onChangeText={setIdentifier} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
      <Text style={s.label}>Mật khẩu</Text>
      <TextInput accessibilityLabel="Mật khẩu" style={s.input} placeholder="Nhập mật khẩu" placeholderTextColor={colors.muted} value={password} onChangeText={setPassword} secureTextEntry />
      <Pressable accessibilityRole="button" onPress={() => showAlert('Quên mật khẩu', 'Chức năng khôi phục mật khẩu sẽ được tích hợp sau.')} style={{ paddingVertical: 10 }}>
        <Text style={[s.link, { textAlign: 'right' }]}>Quên mật khẩu?</Text>
      </Pressable>
      <Button title={isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'} onPress={login} disabled={isSubmitting} />
    </View>
    <Pressable accessibilityRole="button" onPress={() => router.push('/register')} style={{ padding: 12 }}>
      <Text style={[s.link, s.center]}>Chưa có tài khoản? Đăng ký</Text>
    </Pressable>
  </Screen>;
}

