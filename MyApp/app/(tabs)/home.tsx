import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '@/components/campus-ui';
import { useAuth } from '@/components/auth-provider';
import { calculateGpa, classifyGpa, parseCourseGrades } from '@/utils/academic';
import {
  upcomingEvents,
  latestNotifications,
} from '@/data/mockData';

type QuickAction = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  route: Href;
  tint: string;
  color: string;
  badge?: number;
};

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Điểm', icon: 'stats-chart-outline', route: '/(tabs)/grades', tint: '#EFF6FF', color: '#2563EB' },
  { label: 'TKB', icon: 'calendar-outline', route: '/(tabs)/schedule', tint: '#F0FDF4', color: '#16A34A' },
  { label: 'Bản đồ', icon: 'map-outline', route: '/(tabs)/map', tint: '#FFFBEB', color: '#D97706' },
  { label: 'Sự kiện', icon: 'megaphone-outline', route: '/(tabs)/events', tint: '#F5F3FF', color: '#7C3AED' },
  { label: 'Thông báo', icon: 'notifications-outline', route: '/notifications', tint: '#FFF1F2', color: '#E11D48', badge: 3 },
  { label: 'GPA', icon: 'calculator-outline', route: '/(tabs)/grades', tint: '#ECFEFF', color: '#0891B2' },
];

export default function HomeScreen() {
  const { user, grades, timetable, isSyncing } = useAuth();
  const gradeSummary = calculateGpa(grades ? parseCourseGrades(grades.tables) : []);
  const weekdays = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const todayName = weekdays[new Date().getDay()];
  const todayLessons = timetable?.schedules.filter(item => item.day === todayName) ?? [];
  const nextLesson = todayLessons[0];
  // Lớp: chỉ hiển thị nếu dữ liệu user có trường này (đổi tên trường cho khớp với model của bạn)
  const className = (user as { className?: string } | null)?.className;

  // Chia thao tác nhanh thành các hàng 4 cột, hàng cuối được bù ô trống để căn đều
  const actionRows: (QuickAction | null)[][] = [];
  for (let i = 0; i < QUICK_ACTIONS.length; i += 4) {
    const row: (QuickAction | null)[] = QUICK_ACTIONS.slice(i, i + 4);
    while (row.length < 4) row.push(null);
    actionRows.push(row);
  }

  return (
    <Screen>
      {/* 1. THẺ SINH VIÊN */}
      <View style={styles.heroCard}>
        {/* Họa tiết nhẹ, bị cắt theo góc bo của thẻ */}
        <View style={styles.heroDecorClip} pointerEvents="none">
          <View style={styles.heroDecorLarge} />
          <View style={styles.heroDecorSmall} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mở hồ sơ cá nhân"
          style={({ pressed }) => [styles.heroRow, pressed && styles.pressed]}
          onPress={() => router.navigate('/(tabs)/profile')}
        >
          <View style={styles.avatarButton}>
            <Text style={styles.avatarLetter}>
              {user?.name?.trim().charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>

          <View style={styles.studentInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.name ?? 'Sinh viên'}
            </Text>
            <Text style={styles.studentCode}>MSV: {user?.studentId ?? '—'}</Text>
            {className ? <Text style={styles.studentCode}>Lớp: {className}</Text> : null}
          </View>

          <View style={styles.chevronCircle}>
            <Ionicons name="chevron-forward" size={16} color="#2563EB" />
          </View>
        </Pressable>
      </View>

      {/* 2. HAI THẺ THỐNG KÊ GPA VÀ TÍN CHỈ */}
      <View style={styles.statsRow}>
        {/* Thẻ GPA */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Xem chi tiết GPA"
          style={({ pressed }) => [styles.statCard, pressed && styles.pressed]}
          onPress={() => router.push('/(tabs)/grades')}
        >
          <View style={styles.statTop}>
            <View style={styles.iconCircleBlue}>
              <Ionicons name="school" size={18} color="#2563EB" />
            </View>
            <Text style={styles.statLabel}>GPA</Text>
          </View>
          <Text style={styles.statValue}>
            {gradeSummary.gpa === null ? '—' : gradeSummary.gpa.toFixed(2)}
          </Text>
          <Text style={styles.statCaption}>
            {gradeSummary.gpa !== null
              ? `Xếp loại ${classifyGpa(gradeSummary.gpa)}`
              : isSyncing
                ? 'Đang đồng bộ điểm…'
                : grades
                  ? 'Chưa đọc được điểm chữ'
                  : 'Chưa có dữ liệu điểm'}
          </Text>
        </Pressable>

        {/* Thẻ Tín chỉ */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Xem chi tiết Tín chỉ"
          style={({ pressed }) => [styles.statCard, pressed && styles.pressed]}
          onPress={() => router.push('/(tabs)/grades')}
        >
          <View style={styles.statTop}>
            <View style={styles.iconCircleGreen}>
              <Ionicons name="ribbon-outline" size={18} color="#16A34A" />
            </View>
            <Text style={styles.statLabel}>Tín chỉ</Text>
          </View>
          <Text style={styles.statValue}>
            {gradeSummary.gpa === null ? '—' : gradeSummary.earnedCredits}
          </Text>
          <Text style={styles.statCaption}>Số tín chỉ đã tích lũy</Text>
        </Pressable>
      </View>

      {/* 3. LỊCH HỌC HÔM NAY */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Hôm nay</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Mở thời khóa biểu hôm nay"
        style={({ pressed }) => [styles.todayCard, pressed && styles.pressed]}
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
              <Text style={styles.todayTimeEnd}>
                {nextLesson?.period ? `Tiết ${nextLesson.period}` : ''}
              </Text>
            </View>
            <View style={styles.todayContentCol}>
              <Text style={styles.todaySubject} numberOfLines={2}>
                {nextLesson?.subject ?? 'Không có lịch học hôm nay'}
              </Text>
              <Text style={styles.todayLocation}>
                {nextLesson
                  ? `Phòng ${nextLesson.room || 'chưa cập nhật'}`
                  : timetable
                    ? 'Thời khóa biểu đã được đồng bộ'
                    : 'Chưa có dữ liệu thời khóa biểu'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </>
        )}
      </Pressable>

      {/* 4. THAO TÁC NHANH */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
      </View>

      <View style={styles.quickActionsContainer}>
        {actionRows.map((row, rowIndex) => (
          <View
            key={rowIndex}
            style={[styles.quickActionsRow, rowIndex > 0 && styles.quickActionsRowGap]}
          >
            {row.map((action, colIndex) =>
              action ? (
                <Pressable
                  key={action.label}
                  accessibilityRole="button"
                  accessibilityLabel={`Mở ${action.label}`}
                  style={({ pressed }) => [styles.quickActionItem, pressed && styles.pressed]}
                  onPress={() => router.push(action.route)}
                >
                  <View style={[styles.actionIconCircle, { backgroundColor: action.tint }]}>
                    <Ionicons name={action.icon} size={22} color={action.color} />
                    {action.badge ? (
                      <View style={styles.badgeCountCircle}>
                        <Text style={styles.badgeCountText}>{action.badge}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                </Pressable>
              ) : (
                <View key={`empty-${colIndex}`} style={styles.quickActionItem} />
              ),
            )}
          </View>
        ))}
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
        style={styles.eventsScroll}
      >
        {upcomingEvents.map(event => (
          <Pressable
            key={event.id}
            accessibilityRole="button"
            accessibilityLabel={`Sự kiện ${event.title}`}
            style={({ pressed }) => [styles.eventCard, pressed && styles.pressed]}
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
              <Text style={styles.eventLocation} numberOfLines={1}>
                📍 {event.location}
              </Text>
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
              style={({ pressed }) => [
                styles.notificationCard,
                isUnread && styles.notificationUnreadCard,
                pressed && styles.pressed,
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

      <View style={{ height: 24 }} />
    </Screen>
  );
}

/* ===== Bóng đổ và bo góc dùng chung cho mọi card ===== */
const CARD_RADIUS = 22;

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
  },
  android: {
    elevation: 3,
    shadowColor: '#0F172A',
  },
  default: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
  },
});

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },

  /* ===== Thẻ sinh viên ===== */
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: CARD_RADIUS + 2,
    padding: 18,
    marginTop: 2,
    ...cardShadow,
  },
  heroDecorClip: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CARD_RADIUS + 2,
    overflow: 'hidden',
  },
  heroDecorLarge: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#EFF6FF',
    top: -60,
    right: -40,
  },
  heroDecorSmall: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F0F9FF',
    bottom: -26,
    left: 90,
  },
  greetingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 12,
  },
  studentInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  studentCode: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
  },
  avatarButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#DBEAFE',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  chevronCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ===== Thống kê ===== */
  statsRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: CARD_RADIUS,
    padding: 16,
    ...cardShadow,
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircleBlue: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleGreen: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  statValue: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 14,
  },
  statCaption: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },

  /* ===== Tiêu đề mục ===== */
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  viewAllLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },

  /* ===== Hôm nay ===== */
  todayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: CARD_RADIUS,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...cardShadow,
  },
  yellowIndicator: {
    width: 4,
    height: 42,
    borderRadius: 2,
    backgroundColor: '#F59E0B',
    marginRight: 14,
  },
  todayTimeCol: {
    marginRight: 16,
  },
  todayTimeStart: {
    fontSize: 14,
    fontWeight: '800',
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

  /* ===== Thao tác nhanh ===== */
  quickActionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: CARD_RADIUS + 2,
    paddingVertical: 20,
    paddingHorizontal: 10,
    ...cardShadow,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  quickActionsRowGap: {
    marginTop: 18,
  },
  quickActionItem: {
    flex: 1,
    alignItems: 'center',
  },
  actionIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeCountCircle: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
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
    marginTop: 8,
  },

  /* ===== Sự kiện ===== */
  eventsScroll: {
    // Cho phép bóng đổ của thẻ hiển thị đầy đủ, không bị cắt ở mép dưới
    overflow: 'visible',
  },
  eventsScrollContainer: {
    paddingRight: 16,
    paddingBottom: 14,
    gap: 14,
  },
  eventCard: {
    width: 260,
    borderRadius: CARD_RADIUS,
    backgroundColor: '#FFFFFF',
    ...cardShadow,
  },
  eventImageWrapper: {
    width: '100%',
    height: 128,
    backgroundColor: '#E2E8F0',
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    overflow: 'hidden',
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
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
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
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  eventRegisteredText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  eventContent: {
    padding: 14,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 20,
  },
  eventMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
  },
  eventLocation: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },

  /* ===== Thông báo ===== */
  notificationsList: {
    gap: 12,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: CARD_RADIUS - 2,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    ...cardShadow,
  },
  notificationUnreadCard: {
    backgroundColor: '#F5F9FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  notificationIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
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
    marginTop: 6,
  },
});