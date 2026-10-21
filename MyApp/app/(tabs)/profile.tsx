import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '@/components/campus-ui';
import { useAuth } from '@/components/auth-provider';

type Profile = {
  name: string;
  studentId: string;
  email: string;
  className: string;
  cohort: string;
  major: string;
  faculty: string;
  avatar: string;
};

const fields: { key: keyof Profile; label: string; editable?: boolean }[] = [
  { key: 'name', label: 'Họ tên', editable: true },
  { key: 'studentId', label: 'MSSV' },
  { key: 'email', label: 'Email', editable: true },
  { key: 'className', label: 'Lớp', editable: true },
  { key: 'cohort', label: 'Khóa', editable: true },
  { key: 'major', label: 'Ngành', editable: true },
  { key: 'faculty', label: 'Khoa', editable: true },
];

function profileFromUser(user: ReturnType<typeof useAuth>['user']): Profile {
  return {
    name: user?.name ?? '',
    studentId: user?.studentId ?? '',
    email: user?.email ?? '',
    className: user?.className ?? '',
    cohort: user?.cohort ?? '',
    major: user?.major ?? '',
    faculty: user?.faculty ?? '',
    avatar: user?.avatar ?? '',
  };
}

function showMessage(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export default function ProfileScreen() {
  const { user, signOut, updateProfile } = useAuth();
  const [data, setData] = useState<Profile>(() => profileFromUser(user));
  const [draft, setDraft] = useState<Profile>(() => profileFromUser(user));
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fresh = profileFromUser(user);
    setData(fresh);
    setDraft(fresh);
  }, [user]);

  function edit() {
    setDraft(data);
    setEditing(true);
  }

  function cancel() {
    setDraft(data);
    setEditing(false);
  }

  async function save() {
    if (!draft.name.trim() || !draft.email.trim()) {
      showMessage('Thiếu thông tin', 'Vui lòng nhập họ tên và email.');
      return;
    }

    setSaving(true);
    try {
      const saved = await updateProfile({
        name: draft.name.trim(),
        email: draft.email.trim(),
        className: draft.className.trim(),
        cohort: draft.cohort.trim(),
        major: draft.major.trim(),
        faculty: draft.faculty.trim(),
        avatar: draft.avatar,
      });
      const next = profileFromUser(saved);
      setData(next);
      setDraft(next);
      setEditing(false);
    } catch (error) {
      showMessage('Không lưu được', error instanceof Error ? error.message : 'Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  }

  async function chooseAvatar() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.2,
        base64: true,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset.base64) {
        showMessage('Không đọc được ảnh', 'Vui lòng chọn ảnh khác và thử lại.');
        return;
      }

      const mime = asset.mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
      const avatar = `data:${mime};base64,${asset.base64}`;
      if (avatar.length > 1_400_000) {
        showMessage('Ảnh quá lớn', 'Hãy chọn ảnh có dung lượng nhỏ hơn.');
        return;
      }

      setSaving(true);
      const saved = await updateProfile({ ...data, avatar });
      const next = profileFromUser(saved);
      setData(next);
      setDraft(next);
    } catch (error) {
      showMessage('Không cập nhật được ảnh', error instanceof Error ? error.message : 'Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  }

  async function finishLogout() {
    await signOut();
    router.dismissAll();
    router.replace('/');
  }

  function logout() {
    if (Platform.OS === 'web') {
      if (window.confirm('Bạn có chắc muốn đăng xuất?')) void finishLogout();
      return;
    }
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => void finishLogout() },
    ]);
  }

  return (
    <Screen>
        <View style={s.header}>
          <View style={s.avatarWrap}>
            {data.avatar ? (
              <Image source={{ uri: data.avatar }} style={s.avatar} />
            ) : (
              <View style={s.avatar}><Text style={s.initial}>{(data.name.trim()[0] || '?').toUpperCase()}</Text></View>
            )}
            <Pressable accessibilityRole="button" accessibilityLabel="Chọn ảnh đại diện" onPress={() => void chooseAvatar()} disabled={saving} style={s.camera}>
              <Ionicons name="camera" size={15} color="#fff" />
            </Pressable>
          </View>
          <Text style={s.name}>{data.name || 'Sinh viên'}</Text>
          <Text style={s.id}>{data.studentId || '—'}</Text>
        </View>

        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.title}>Thông tin hồ sơ</Text>
            {!editing && (
              <Pressable onPress={edit} style={s.edit} accessibilityRole="button">
                <Ionicons name="create-outline" size={16} color="#2563EB" />
                <Text style={s.editText}>Chỉnh sửa</Text>
              </Pressable>
            )}
          </View>
          {fields.map((field, index) => {
            const value = editing ? draft[field.key] : data[field.key];
            const empty = !value.trim();
            return (
              <View key={field.key} style={[s.field, index === fields.length - 1 && s.last]}>
                <Text style={s.label}>{field.label}</Text>
                {editing && field.editable ? (
                  <TextInput
                    accessibilityLabel={field.label}
                    value={value}
                    onChangeText={text => setDraft(current => ({ ...current, [field.key]: text }))}
                    placeholder={`Nhập ${field.label.toLowerCase()}`}
                    autoCapitalize={field.key === 'email' ? 'none' : 'words'}
                    keyboardType={field.key === 'email' ? 'email-address' : 'default'}
                    style={s.input}
                  />
                ) : (
                  <View style={s.valueRow}>
                    <Text style={[s.value, empty && s.empty]}>{value || '—'}</Text>
                    {empty && <Ionicons name="alert-circle" size={18} color="#E8A317" accessibilityLabel="Chưa cập nhật" />}
                  </View>
                )}
              </View>
            );
          })}
          {editing && (
            <View style={s.buttons}>
              <Pressable onPress={cancel} disabled={saving} style={s.cancel}><Text style={s.cancelText}>Hủy</Text></Pressable>
              <Pressable onPress={() => void save()} disabled={saving} style={[s.save, saving && s.disabled]}>
                <Text style={s.saveText}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={s.actions}>
          <Pressable onPress={() => router.push('/settings')} style={s.row}>
            <Ionicons name="settings-outline" size={19} color="#475569" />
            <Text style={s.action}>Cài đặt</Text>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </Pressable>
          <Pressable onPress={() => router.push('/notifications')} style={s.row}>
            <Ionicons name="notifications-outline" size={19} color="#475569" />
            <Text style={s.action}>Thông báo</Text>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </Pressable>
          <Pressable onPress={logout} style={[s.row, s.last]}>
            <Ionicons name="log-out-outline" size={19} color="#DC2626" />
            <Text style={s.logout}>Đăng xuất</Text>
          </Pressable>
        </View>
      <Modal transparent animationType="fade" visible={saving} onRequestClose={() => undefined}>
        <View style={s.modalBackdrop}>
          <View style={s.loadingCard}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={s.loadingTitle}>Đang lưu hồ sơ</Text>
            <Text style={s.loadingHint}>Đang cập nhật thông tin của bạn…</Text>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const s = StyleSheet.create({
  modalBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.35)' },
  loadingCard: { alignItems: 'center', padding: 26, borderRadius: 20, backgroundColor: '#fff', minWidth: 230, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 18, elevation: 8 },
  loadingTitle: { marginTop: 14, color: '#172554', fontSize: 16, fontWeight: '800' },
  loadingHint: { marginTop: 6, color: '#64748B', fontSize: 12 },
  header: { alignItems: 'center', paddingTop: 8, paddingBottom: 18 },
  avatarWrap: { position: 'relative', marginBottom: 10 },
  avatar: { width: 78, height: 78, alignItems: 'center', justifyContent: 'center', borderRadius: 39, backgroundColor: '#DBEAFE', borderWidth: 3, borderColor: '#fff' },
  initial: { color: '#1D4ED8', fontSize: 28, fontWeight: '800' },
  camera: { position: 'absolute', right: -3, bottom: 0, width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: '#F97316', borderWidth: 2, borderColor: '#fff' },
  name: { color: '#0F172A', fontSize: 19, fontWeight: '800' },
  id: { marginTop: 3, color: '#64748B', fontSize: 13 },
  card: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EEF2F7', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardHeader: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: '#172554', fontSize: 15, fontWeight: '800' },
  edit: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 9, backgroundColor: '#EFF6FF' },
  editText: { color: '#2563EB', fontSize: 12, fontWeight: '700' },
  field: { minHeight: 50, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  last: { borderBottomWidth: 0 },
  label: { color: '#94A3B8', fontSize: 12 },
  value: { marginTop: 3, color: '#0F172A', fontSize: 14, fontWeight: '600' },
  empty: { color: '#94A3B8', fontWeight: '400' },
  valueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  input: { minHeight: 38, marginTop: 4, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#DCE6F3', borderRadius: 9, backgroundColor: '#F8FAFC', color: '#0F172A', fontSize: 14 },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 9, paddingVertical: 12 },
  cancel: { justifyContent: 'center', paddingHorizontal: 16, minHeight: 39, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  cancelText: { color: '#475569', fontSize: 13, fontWeight: '700' },
  save: { justifyContent: 'center', paddingHorizontal: 16, minHeight: 39, borderRadius: 10, backgroundColor: '#2563EB' },
  disabled: { opacity: 0.6 },
  saveText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  actions: { marginTop: 14, paddingHorizontal: 14, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#EEF2F7' },
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  action: { flex: 1, color: '#334155', fontSize: 14, fontWeight: '600' },
  logout: { flex: 1, color: '#DC2626', fontSize: 14, fontWeight: '600' },
});
