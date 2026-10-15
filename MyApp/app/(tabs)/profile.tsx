import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '@/components/campus-ui';
import { useAuth } from '@/components/auth-provider';

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || '—'}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  async function finishLogout() {
    await signOut();
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
  return (
    <Screen>
      <View style={styles.profileHeader}>
        <View accessibilityLabel={`Ảnh đại diện ${user?.name ?? ''}`} style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name.trim().charAt(0).toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.name ?? 'Sinh viên'}</Text>
        <Text style={styles.studentId}>{user?.studentId ?? '—'}</Text>
      </View>

      <View style={styles.infoCard}>
        <ProfileField label="Họ tên" value={user?.name ?? ''} />
        <ProfileField label="MSSV" value={user?.studentId ?? ''} />
        <ProfileField label="Email" value={user?.email ?? ''} />
        <ProfileField label="Lớp" value="" />
        <ProfileField label="Khóa" value="" />
        <ProfileField label="Ngành" value="" />
        <ProfileField label="Khoa" value="" />
      </View>

      <View style={styles.actionsCard}>
        <Pressable
          accessibilityRole="button"
          style={styles.actionRow}
          onPress={() => router.push('/notifications')}
        >
          <Ionicons name="notifications-outline" size={19} color="#475569" />
          <Text style={styles.actionLabel}>Cài đặt thông báo</Text>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={[styles.actionRow, styles.logoutRow]}
          onPress={logout}
        >
          <Ionicons name="log-out-outline" size={19} color="#DC2626" />
          <Text style={styles.logoutLabel}>Đăng xuất</Text>
          <View style={{ width: 18 }} />
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 18,
  },
  avatar: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 38,
    backgroundColor: '#DBEAFE',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    color: '#1D4ED8',
    fontSize: 28,
    fontWeight: '800',
  },
  name: {
    marginTop: 10,
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  studentId: {
    marginTop: 3,
    color: '#64748B',
    fontSize: 13,
  },
  infoCard: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  field: {
    minHeight: 48,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  fieldLabel: {
    color: '#94A3B8',
    fontSize: 12,
  },
  fieldValue: {
    marginTop: 3,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsCard: {
    marginTop: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },
  actionRow: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  actionLabel: {
    flex: 1,
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutRow: {
    borderBottomWidth: 0,
  },
  logoutLabel: {
    flex: 1,
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
});

