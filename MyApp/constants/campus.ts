import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#1D4ED8', dark: '#1E3A8A', light: '#2563EB',
  background: '#F1F5F9', card: '#FFFFFF', text: '#0F172A',
  muted: '#64748B', border: '#CBD5E1', input: '#F8FAFC',
};

// Style dùng chung để các màn hình có cùng màu sắc và khoảng cách.
export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { padding: 22, gap: 18, flexGrow: 1, width: '100%', maxWidth: 720, alignSelf: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  grow: { flex: 1 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  heading: { fontSize: 19, fontWeight: '700', color: colors.text },
  text: { fontSize: 15, lineHeight: 23, color: colors.text },
  muted: { fontSize: 14, lineHeight: 22, color: colors.muted },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  link: { fontSize: 15, fontWeight: '600', color: colors.primary },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 18, gap: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  hero: { backgroundColor: colors.dark, borderRadius: 16, padding: 24, gap: 12 },
  white: { color: colors.card },
  input: { backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, borderRadius: 10, minHeight: 48, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: colors.text },
  button: { minHeight: 50, backgroundColor: colors.primary, borderRadius: 10, padding: 14, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: colors.card, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  secondary: { backgroundColor: '#DBEAFE' },
  pressed: { opacity: 0.7 },
  disabled: { backgroundColor: colors.muted },
  badge: { color: colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center' },
  placeholder: { minHeight: 190, backgroundColor: '#DBEAFE', borderRadius: 16, padding: 24, gap: 14, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { flexBasis: '46%', flexGrow: 1, minHeight: 112 },
  day: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  unread: { backgroundColor: '#EFF6FF', borderColor: '#93C5FD' },
});

