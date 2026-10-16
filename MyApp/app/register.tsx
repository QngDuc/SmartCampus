import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Button } from '@/components/campus-ui';
import { colors, s } from '@/constants/campus';

import { showAlert } from '@/utils/feedback';
import { useAuth } from '@/components/auth-provider';
import { registerUser } from '@/utils/auth';
import { AuthLoadingOverlay } from '@/components/auth-loading-overlay';
import { describeSync } from '@/utils/academic';

export default function RegisterScreen() {
  const { signIn } = useAuth();
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function register() {
    // Kiểm tra các ô input có bị bỏ trống không.
    if (!studentId.trim() || !name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      showAlert('Thông báo', 'Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    if (!/^\d{8}$/.test(studentId.trim())) {
      showAlert('Thông báo', 'Mã sinh viên phải gồm đúng 8 chữ số.');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Thông báo', 'Mật khẩu xác nhận không khớp!');
      return;
    }
    if (password.length < 8) {
      showAlert('Thông báo', 'Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await registerUser({
        studentId: studentId.trim(),
        name: name.trim(),
        email: email.trim(),
        password,
      });
      const summary = await signIn(session);
      router.replace('/(tabs)/home');
      setTimeout(() => showAlert('Tạo tài khoản thành công', describeSync(summary)), 150);
    } catch (error) {
      showAlert('Đăng ký thất bại', error instanceof Error ? error.message : 'Đã xảy ra lỗi.');
    } finally {
      setIsSubmitting(false);
    }
  }
  return <Screen form>
    <AuthLoadingOverlay visible={isSubmitting} title="Đang tạo tài khoản" />
    <Text style={s.badge}>SMART CAMPUS</Text>
    <Text style={s.title}>Tạo tài khoản</Text>
    <Text style={s.muted}>Tham gia cộng đồng sinh viên của bạn.</Text>
    <View style={s.card}>
      <Text style={s.label}>Mã sinh viên</Text>
      <TextInput accessibilityLabel="Mã sinh viên" style={s.input} placeholder="23103047" placeholderTextColor={colors.muted} value={studentId} onChangeText={setStudentId} keyboardType="number-pad" maxLength={8} />
      <Text style={s.label}>Họ và tên</Text>
      <TextInput accessibilityLabel="Họ và tên" style={s.input} placeholder="Nguyễn Văn A" placeholderTextColor={colors.muted} value={name} onChangeText={setName} autoCapitalize="words" />
      <Text style={s.label}>Email</Text>
      <TextInput accessibilityLabel="Email" style={s.input} placeholder="you@student.edu.vn" placeholderTextColor={colors.muted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
      <Text style={s.label}>Mật khẩu</Text>
      <TextInput accessibilityLabel="Mật khẩu" style={s.input} placeholder="Nhập mật khẩu" placeholderTextColor={colors.muted} value={password} onChangeText={setPassword} secureTextEntry />
      <Text style={s.label}>Xác nhận mật khẩu</Text>
      <TextInput accessibilityLabel="Xác nhận mật khẩu" style={s.input} placeholder="Nhập lại mật khẩu" placeholderTextColor={colors.muted} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
      <Button title={isSubmitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'} onPress={register} disabled={isSubmitting} />
    </View>
    <Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={{ padding: 12 }}>
      <Text style={[s.link, s.center]}>Đã có tài khoản? Đăng nhập</Text>
    </Pressable>
  </Screen>;
}

