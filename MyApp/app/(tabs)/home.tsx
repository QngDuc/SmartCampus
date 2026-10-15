import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '@/components/campus-ui';
import { useAuth } from '@/components/auth-provider';
import { calculateGpa, parseCourseGrades } from '@/utils/academic';
import {
  upcomingEvents,
  latestNotifications,
} from '@/data/mockData';

export default function HomeScreen() {
  const { user, grades, timetable, isSyncing } = useAuth();
  const gradeSummary = calculateGpa(grades ? parseCourseGrades(grades.tables) : []);
  const weekdays = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const todayName = weekdays[new Date().getDay()];
  const todayLessons = timetable?.schedules.filter(item => item.day === todayName) ?? [];
  const nextLesson = todayLessons[0];

  return (
    <Screen>
      {/* 1. LỜI CHÀO & AVATAR SINH VIÊN */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.greetingText}>Xin chào 👋</Text>
          <Text style={styles.userName}>{user?.name ?? 'Sinh viên'}</Text>
          <Text style={styles.studentCode}>{user?.studentId ?? ''}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mở hồ sơ cá nhân"
          style={styles.avatarButton}
          onPress={() => router.navigate('/(tabs)/profile')}
        >
          <Text style={styles.avatarLetter}>{user?.name.trim().charAt(0).toUpperCase() ?? '?'}</Text>
        </Pressable>
      </View>

      {/* 2. HAI THẺ THỐNG KÊ GPA VÀ TÍN CHỈ */}
      <View style={styles.statsRow}>
        {/* Thẻ GPA */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Xem chi tiết GPA"
          style={styles.statCard}
          onPress={() => router.push('/(tabs)/grades')}
        >
          <View style={styles.statTop}>
            <View style={styles.iconCircleBlue}>
              <Ionicons name="school" size={17} color="#2563EB" />
            </View>
            <Text style={styles.statLabel}>GPA</Text>
          </View>
          <Text style={styles.statValue}>{gradeSummary.gpa === null ? '—' : gradeSummary.gpa.toFixed(2)}</Text>
        </Pressable>

        {/* Thẻ Tín chỉ */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Xem chi tiết Tín chỉ"
          style={styles.statCard}
          onPress={() => router.push('/(tabs)/grades')}
        >
          <View style={styles.statTop}>
            <View style={styles.iconCircleGreen}>
              <Ionicons name="ribbon-outline" size={17} color="#16A34A" />
            </View>
            <Text style={styles.statLabel}>Tín chỉ</Text>
          </View>
          <Text style={styles.statValue}>{gradeSummary.gpa === null ? '—' : gradeSummary.earnedCredits}</Text>
        </Pressable>
      </View>

      {/* 3. LỊCH HỌC HÔM NAY */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Hôm nay</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Mở thời khóa biểu hôm nay"
        style={styles.todayCard}
        onPress={() => router.push('/(tabs)/schedule')}
      >
        <View style={styles.yellowIndicator} />
        {isSyncing && !timetable ? (
          <View style={styles.todayContentCol}>
            <ActivityIndicator size="small" color="#2563EB" />
            <Text style={styles.todayLocation}>Đang đồng bộ thời khóa biểu…</Text>
          </View>
        ) : (
          <>
            <View style={styles.todayTimeCol}>
              <Text style={styles.todayTimeStart}>{nextLesson?.session ?? 'Hôm nay'}</Text>
              <Text style={styles.todayTimeEnd}>{nextLesson?.period ? `Tiết ${nextLesson.period}` : ''}</Text>
            </View>
            <View style={styles.todayContentCol}>
              <Text style={styles.todaySubject}>{nextLesson?.subject ?? 'Không có lịch học hôm nay'}</Text>
              <Text style={styles.todayLocation}>{nextLesson ? `Phòng ${nextLesson.room || 'chưa cập nhật'}` : timetable ? 'Thời khóa biểu đã được đồng bộ' : 'Chưa có dữ liệu thời khóa biểu'}</Text>
            </View>
          </>
        )}
      </Pressable>

      {/* 4. THAO TÁC NHANH */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
      </View>

      <View style={styles.quickActionsContainer}>
        {/* Hàng 1: Điểm, TKB, Bản đồ, Sự kiện */}
        <View style={styles.quickActionsRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mở bảng điểm"
            style={styles.quickActionItem}
            onPress={() => router.push('/(tabs)/grades')}
          >
            <View style={styles.actionIconCircle}>
              <Ionicons name="stats-chart-outline" size={22} color="#2563EB" />
            </View>
            <Text style={styles.actionLabel}>Điểm</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mở thời khóa biểu"
            style={styles.quickActionItem}
            onPress={() => router.push('/(tabs)/schedule')}
          >
            <View style={styles.actionIconCircle}>
              <Ionicons name="calendar-outline" size={22} color="#2563EB" />
            </View>
            <Text style={styles.actionLabel}>TKB</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mở bản đồ trường"
            style={styles.quickActionItem}
            onPress={() => router.push('/(tabs)/map')}
          >
            <View style={styles.actionIconCircle}>
              <Ionicons name="map-outline" size={22} color="#2563EB" />
            </View>
            <Text style={styles.actionLabel}>Bản đồ</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mở sự kiện"
            style={styles.quickActionItem}
            onPress={() => router.push('/(tabs)/events')}
          >
            <View style={styles.actionIconCircle}>
              <Ionicons name="megaphone-outline" size={22} color="#2563EB" />
            </View>
            <Text style={styles.actionLabel}>Sự kiện</Text>
          </Pressable>
        </View>

        {/* Hàng 2: Thông báo, GPA */}
        <View style={[styles.quickActionsRow, { marginTop: 16 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mở thông báo"
            style={styles.quickActionItem}
            onPress={() => router.push('/notifications')}
          >
            <View style={styles.actionIconCircle}>
              <Ionicons name="notifications-outline" size={22} color="#2563EB" />
              <View style={styles.badgeCountCircle}>
                <Text style={styles.badgeCountText}>3</Text>
              </View>
            </View>
            <Text style={styles.actionLabel}>Thông báo</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mở tính điểm GPA"
            style={styles.quickActionItem}
            onPress={() => router.push('/(tabs)/grades')}
          >
            <View style={styles.actionIconCircle}>
              <Ionicons name="calculator-outline" size={22} color="#2563EB" />
            </View>
            <Text style={styles.actionLabel}>GPA</Text>
          </Pressable>

          {/* Giữ chỗ căn đều 4 cột */}
          <View style={styles.quickActionItem} />
          <View style={styles.quickActionItem} />
        </View>
      </View>

      {/* 5. SỰ KIỆN SẮP TỚI */}
      <View style={styles.sectionHeaderBetween}>
        <Text style={styles.sectionTitle}>Sự kiện sắp tới</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Xem tất cả sự kiện"
          onPress={() => router.push('/(tabs)/events')}
        >
          <Text style={styles.viewAllLink}>Xem tất cả</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.eventsScrollContainer}
      >
        {upcomingEvents.map(event => (
          <Pressable
            key={event.id}
            accessibilityRole="button"
            accessibilityLabel={`Sự kiện ${event.title}`}
            style={styles.eventCard}
            onPress={() =>
              router.push({
                pathname: '/event-detail',
                params: { id: event.id },
              })
            }
          >
            <View style={styles.eventImageWrapper}>
              <Image source={{ uri: event.image }} style={styles.eventImage} resizeMode="cover" />

              {/* Tag danh mục */}
              <View style={styles.eventCategoryBadge}>
                <Text style={styles.eventCategoryText}>{event.category}</Text>
              </View>

              {/* Tag đã đăng ký nếu có */}
              {event.isRegistered && (
                <View style={styles.eventRegisteredBadge}>
                  <Text style={styles.eventRegisteredText}>✓ Đã đăng ký</Text>
                </View>
              )}
            </View>

            <View style={styles.eventContent}>
              <Text style={styles.eventTitle} numberOfLines={2}>
                {event.title}
              </Text>
              <Text style={styles.eventMeta}>
                📅 {event.date} - {event.time}
              </Text>
              <Text style={styles.eventLocation}>📍 {event.location}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* 6. THÔNG BÁO MỚI NHẤT */}
      <View style={styles.sectionHeaderBetween}>
        <Text style={styles.sectionTitle}>Thông báo mới nhất</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mở danh sách thông báo"
          onPress={() => router.push('/notifications')}
        >
          <Ionicons name="chevron-forward" size={18} color="#64748B" />
        </Pressable>
      </View>

      <View style={styles.notificationsList}>
        {latestNotifications.map(item => {
          const isUnread = !item.isRead;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`Thông báo: ${item.title}`}
              style={[
                styles.notificationCard,
                isUnread ? styles.notificationUnreadCard : styles.notificationReadCard,
              ]}
              onPress={() => {
                if (item.type === 'grade') {
                  router.push('/(tabs)/grades');
                } else if (item.type === 'event') {
                  router.push('/(tabs)/events');
                } else {
                  router.push('/notifications');
                }
              }}
            >
              <View
                style={[
                  styles.notificationIconBox,
                  isUnread ? styles.iconBoxUnread : styles.iconBoxRead,
                ]}
              >
                {item.type === 'grade' && <Ionicons name="school" size={20} color="#2563EB" />}
                {item.type === 'event' && <Ionicons name="megaphone" size={20} color="#2563EB" />}
                {item.type === 'system' && (
                  <Ionicons name="settings-sharp" size={20} color="#2563EB" />
                )}
              </View>

              <View style={styles.notificationContentCol}>
                <View style={styles.notificationTitleRow}>
                  <Text style={styles.notificationTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {isUnread && <View style={styles.unreadDot} />}
                </View>

                <Text style={styles.notificationBody} numberOfLines={2}>
                  {item.content}
                </Text>

                <Text style={styles.notificationTime}>{item.time}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={{ height: 16 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  headerLeft: {
    flex: 1,
  },
  greetingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  studentCode: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircleBlue: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleGreen: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  viewAllLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  todayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  yellowIndicator: {
    width: 3.5,
    height: 38,
    borderRadius: 2,
    backgroundColor: '#F59E0B',
    marginRight: 12,
  },
  todayTimeCol: {
    marginRight: 16,
  },
  todayTimeStart: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  todayTimeEnd: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  todayContentCol: {
    flex: 1,
  },
  todaySubject: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  todayLocation: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  quickActionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickActionItem: {
    flex: 1,
    alignItems: 'center',
  },
  actionIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeCountCircle: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginTop: 6,
  },
  eventsScrollContainer: {
    paddingRight: 16,
    gap: 14,
  },
  eventCard: {
    width: 255,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  eventImageWrapper: {
    width: '100%',
    height: 120,
    backgroundColor: '#E2E8F0',
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventCategoryBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  eventCategoryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  eventRegisteredBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  eventRegisteredText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  eventContent: {
    padding: 13,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
  },
  eventMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
  },
  eventLocation: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  notificationsList: {
    gap: 10,
  },
  notificationCard: {
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
  },
  notificationUnreadCard: {
    backgroundColor: '#EFF6FF',
  },
  notificationReadCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  notificationIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxUnread: {
    backgroundColor: '#DBEAFE',
  },
  iconBoxRead: {
    backgroundColor: '#EFF6FF',
  },
  notificationContentCol: {
    flex: 1,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    lineHeight: 19,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
    marginTop: 5,
  },
  notificationBody: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 5,
  },
});
