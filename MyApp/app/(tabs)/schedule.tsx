import { useAppTheme } from '@/components/theme-provider';
import { useAdaptiveStyles } from '@/components/theme-provider';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Screen } from '@/components/campus-ui';
import { s } from '@/constants/campus';
import { canRoute } from '@/data/campusRouting';
import { locations } from '@/data/mockData';
import { showAlert } from '@/utils/feedback';
import { useAuth } from '@/components/auth-provider';
import type { TimetableItem } from '@/utils/academic';

// Chuyển dạng 28/09/2026 thành Date của JavaScript
function parseVietnamDate(value: string) {
  const [day, month, year] = value
    .split('/')
    .map(Number);

  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function scheduleDate(item: TimetableItem) {
  const dateMatch = item.date.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
  if (dateMatch) {
    const weekStart = item.weekStart ? parseVietnamDate(item.weekStart) : null;
    const year = Number(dateMatch[3] ?? weekStart?.getFullYear() ?? new Date().getFullYear());
    const date = new Date(year, Number(dateMatch[2]) - 1, Number(dateMatch[1]));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const weekStart = item.weekStart ? parseVietnamDate(item.weekStart) : null;
  if (!weekStart) return null;
  const weekday = item.day === 'CN' ? 0 : Number(item.day.match(/\d+/)?.[0] ?? 0);
  if (!weekday && item.day !== 'CN') return null;
  const offset = (weekday - weekStart.getDay() + 7) % 7;
  weekStart.setDate(weekStart.getDate() + offset);
  return weekStart;
}

export default function ScheduleScreen() {
  const { isDark } = useAppTheme();
  const styles = useAdaptiveStyles(baseStyles);
  const { timetable, isSyncing, syncErrors } = useAuth();
  const scheduleList = timetable?.schedules ?? [];
  const [view, setView] = useState<'today' | 'week' | 'month'>('month');
  const [periodDate, setPeriodDate] = useState(() => new Date());
  const [reminders, setReminders] = useState<string[]>([]);
  const datedLessons = scheduleList.flatMap(item => {
    const date = scheduleDate(item);
    return date ? [{ item, date, key: dateKey(date) }] : [];
  });
  const rangeStart = new Date(periodDate.getFullYear(), periodDate.getMonth(), periodDate.getDate());
  const rangeEnd = new Date(rangeStart);
  if (view === 'week') {
    rangeStart.setDate(rangeStart.getDate() - ((rangeStart.getDay() + 6) % 7));
    rangeEnd.setTime(rangeStart.getTime());
    rangeEnd.setDate(rangeStart.getDate() + 6);
  } else if (view === 'month') {
    rangeStart.setDate(1);
    rangeEnd.setFullYear(rangeStart.getFullYear(), rangeStart.getMonth() + 1, 0);
  }
  const startKey = dateKey(rangeStart);
  const endKey = dateKey(rangeEnd);
  const groupedLessons = new Map<string, { date: Date; items: TimetableItem[] }>();
  for (const lesson of datedLessons) {
    if (lesson.key < startKey || lesson.key > endKey) continue;
    const group = groupedLessons.get(lesson.key) ?? { date: lesson.date, items: [] };
    group.items.push(lesson.item);
    groupedLessons.set(lesson.key, group);
  }
  const agenda = [...groupedLessons.values()].sort((first, second) => first.date.getTime() - second.date.getTime());
  const periodLabel = view === 'today'
    ? 'Hôm nay'
    : view === 'week'
      ? `${rangeStart.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} – ${rangeEnd.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`
      : periodDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

  function remind(item: TimetableItem) {
    const reminderId = `${item.date}-${item.subject}-${item.session}`;
    if (reminders.includes(reminderId)) return;
    setReminders(previous => [...previous, reminderId]);
    showAlert('Đã bật nhắc lịch', `${item.subject} · ${item.date} · ${item.session}`);
  }

  function openCampusMap(item: TimetableItem) {
    const roomNumber = Number(item.room.match(/\d+/)?.[0]);
    const destinationId = locations.some(location => location.id === roomNumber) ? roomNumber : 100;
    router.navigate({
      pathname: '/(tabs)/map',
      params: {
        locationId: String(destinationId),
        directions: canRoute(destinationId) ? '1' : '0',
      },
    });
  }

  return (
    <Screen>
      <Text style={s.title}>Thời khóa biểu</Text>

      <View style={styles.viewSelector}>
        {([
          { key: 'today', label: 'Hôm nay' },
          { key: 'week', label: 'Tuần' },
          { key: 'month', label: 'Tháng' },
        ] as const).map(option => {
          const active = view === option.key;
          return (
            <Pressable key={option.key} accessibilityRole="button" accessibilityState={{ selected: active }} style={[styles.viewOption, active && styles.viewOptionActive]} onPress={() => {
              setView(option.key);
              if (option.key === 'today') setPeriodDate(new Date());
            }}>
              <Text style={[styles.viewOptionText, active && styles.viewOptionTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {isSyncing && !timetable && (
        <View style={[s.card, { alignItems: 'center' }]}>
          <ActivityIndicator color="#2563EB" />
          <Text style={s.muted}>Đang đồng bộ thời khóa biểu…</Text>
        </View>
      )}

      {!!syncErrors.timetable && !isSyncing && (
        <View style={[s.card, { backgroundColor: isDark ? '#332A1D' : '#FFF7ED', borderColor: isDark ? '#5A4828' : '#FED7AA' }]}>
          <Text style={s.heading}>Chưa tải được thời khóa biểu</Text>
          <Text style={s.muted}>{syncErrors.timetable}</Text>
        </View>
      )}

      {timetable && (
        <>
          <View style={styles.periodHeader}>
            <Pressable accessibilityRole="button" accessibilityLabel="Kỳ trước" style={styles.periodArrow} onPress={() => {
              const delta = view === 'today' ? -1 : view === 'week' ? -7 : 0;
              setPeriodDate(current => new Date(current.getFullYear(), current.getMonth() + (view === 'month' ? -1 : 0), current.getDate() + delta));
            }}>
              <Ionicons name="chevron-back" size={19} color="#2563EB" />
            </Pressable>
            <Text style={styles.periodLabel}>{periodLabel}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Kỳ tiếp theo" style={styles.periodArrow} onPress={() => {
              const delta = view === 'today' ? 1 : view === 'week' ? 7 : 0;
              setPeriodDate(current => new Date(current.getFullYear(), current.getMonth() + (view === 'month' ? 1 : 0), current.getDate() + delta));
            }}>
              <Ionicons name="chevron-forward" size={19} color="#2563EB" />
            </Pressable>
            <Pressable accessibilityRole="button" style={styles.todayButton} onPress={() => setPeriodDate(new Date())}>
              <Text style={styles.todayButtonText}>Hôm nay</Text>
            </Pressable>
          </View>

          {agenda.length === 0 ? (
            <View style={styles.emptyAgenda}>
              <Ionicons name="calendar-clear-outline" size={34} color="#94A3B8" />
              <Text style={styles.emptyTitle}>Chưa có lịch học</Text>
              <Text style={styles.emptyText}>Không có buổi học trong khoảng thời gian này.</Text>
            </View>
          ) : agenda.map(({ date, items }) => (
            <View key={dateKey(date)} style={styles.agendaGroup}>
              <Text style={styles.dateHeading}>{date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}</Text>
              {items.map((item, index) => {
                const reminderId = `${item.date}-${item.subject}-${item.session}`;
                const reminded = reminders.includes(reminderId);
                return (
                  <View key={`${item.subject}-${item.session}-${index}`} style={styles.lessonCard}>
                    <View style={[styles.lessonAccent, styles[`accent${index % 4}` as 'accent0' | 'accent1' | 'accent2' | 'accent3']]} />
                    <View style={styles.lessonTimeColumn}>
                      <Text style={styles.lessonSession}>{item.session}</Text>
                      {!!item.period && <Text style={styles.lessonPeriod}>Tiết {item.period}</Text>}
                    </View>
                    <View style={styles.lessonDetails}>
                      <Text style={styles.lessonSubject}>{item.subject}</Text>
                      <Text style={styles.lessonRoom}>{item.room ? `⌖  Phòng ${item.room}` : 'Phòng chưa cập nhật'}{item.period ? ` · Tiết ${item.period}` : ''}</Text>
                      {!!item.teacher && <Text style={styles.lessonTeacher}>{item.teacher}</Text>}
                      <View style={styles.lessonActions}>
                        <Pressable accessibilityRole="button" accessibilityState={{ disabled: reminded }} style={[styles.lessonAction, styles.reminderAction, reminded && styles.actionDone]} disabled={reminded} onPress={() => remind(item)}>
                          <Ionicons name={reminded ? 'checkmark-circle' : 'notifications-outline'} size={16} color={reminded ? '#15803D' : '#2563EB'} />
                          <Text style={[styles.reminderActionText, reminded && styles.actionDoneText]}>{reminded ? 'Đã nhắc' : 'Nhắc lịch'}</Text>
                        </Pressable>
                        <Pressable accessibilityRole="button" style={[styles.lessonAction, styles.directionAction]} onPress={() => openCampusMap(item)}>
                          <Ionicons name="navigate-outline" size={16} color="#FFFFFF" />
                          <Text style={styles.directionActionText}>Chỉ đường</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </>
      )}

    </Screen>
  );
}

const baseStyles = StyleSheet.create({
  viewSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  viewOption: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#2563EB',
    borderRadius: 14,
    backgroundColor: 'transparent',
  },
  viewOptionActive: { backgroundColor: '#2563EB' },
  viewOptionText: { color: '#2563EB', fontSize: 15, fontWeight: '700' },
  viewOptionTextActive: { color: '#FFFFFF' },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 8,
  },
  periodArrow: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
  },
  periodLabel: { flex: 1, marginHorizontal: 8, color: '#334155', fontSize: 14, fontWeight: '700', textAlign: 'center', textTransform: 'capitalize' },
  todayButton: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9, backgroundColor: '#DBEAFE' },
  todayButtonText: { color: '#1D4ED8', fontSize: 12, fontWeight: '700' },
  agendaGroup: { gap: 10, marginTop: 14 },
  dateHeading: { color: '#64748B', fontSize: 14, fontWeight: '600', textTransform: 'capitalize' },
  lessonCard: { flexDirection: 'row', alignItems: 'stretch', gap: 12, padding: 14, borderRadius: 20, backgroundColor: '#FFFFFF', shadowColor: '#0F172A', shadowOpacity: 0.04, shadowRadius: 12, elevation: 1 },
  lessonAccent: { width: 4, borderRadius: 3, backgroundColor: '#2563EB' },
  accent0: { backgroundColor: '#2563EB' },
  accent1: { backgroundColor: '#EC4899' },
  accent2: { backgroundColor: '#8B5CF6' },
  accent3: { backgroundColor: '#14B8A6' },
  lessonTimeColumn: { width: 66, justifyContent: 'flex-start', paddingTop: 1 },
  lessonSession: { color: '#0F172A', fontSize: 14, fontWeight: '700' },
  lessonPeriod: { marginTop: 4, color: '#64748B', fontSize: 12 },
  lessonDetails: { flex: 1, gap: 5 },
  lessonSubject: { color: '#1E293B', fontSize: 15, lineHeight: 21, fontWeight: '700' },
  lessonRoom: { color: '#64748B', fontSize: 12, lineHeight: 17 },
  lessonTeacher: { color: '#64748B', fontSize: 12 },
  lessonActions: { flexDirection: 'row', gap: 8, marginTop: 5 },
  lessonAction: { flex: 1, minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 9 },
  reminderAction: { borderWidth: 1, borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' },
  reminderActionText: { color: '#1D4ED8', fontSize: 12, fontWeight: '700' },
  directionAction: { backgroundColor: '#2563EB' },
  directionActionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  actionDone: { borderColor: '#BBF7D0', backgroundColor: '#F0FDF4' },
  actionDoneText: { color: '#15803D' },
  emptyAgenda: { alignItems: 'center', gap: 8, padding: 28, borderRadius: 16, backgroundColor: '#FFFFFF' },
  emptyTitle: { color: '#0F172A', fontSize: 15, fontWeight: '700' },
  emptyText: { color: '#64748B', fontSize: 13, textAlign: 'center' },
});

const styles = baseStyles;