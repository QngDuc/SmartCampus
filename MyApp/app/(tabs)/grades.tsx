import { useAdaptiveStyles, useAppTheme } from '@/components/theme-provider';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '@/components/campus-ui';
import { useAuth } from '@/components/auth-provider';
import {
  calculateGpa,
  calculateSemesterGpa,
  classifyGpa,
  parseCourseGrades,
  type CourseGrade,
} from '@/utils/academic';

type ViewMode = 'semester' | 'all';

type SemesterGroup = {
  key: string;
  title: string;
  subtitle: string;
  courses: CourseGrade[];
  gpa: number | null;
  registeredCredits: number;
  earnedCredits: number;
  sortKey: number;
};

const DARK_GRADE_STYLE: Record<string, { bg: string; fg: string; border: string }> = {
  A: { bg: '#16352A', fg: '#FFFFFF', border: '#28563F' },
  B: { bg: '#1A2B45', fg: '#FFFFFF', border: '#2B4770' },
  C: { bg: '#3A301D', fg: '#FFFFFF', border: '#66542C' },
  D: { bg: '#3A291B', fg: '#FFFFFF', border: '#67452B' },
  F: { bg: '#3C2026', fg: '#FFFFFF', border: '#6A303A' },
  P: { bg: '#302745', fg: '#FFFFFF', border: '#4D3D6B' },
  none: { bg: '#1B2738', fg: '#FFFFFF', border: '#2A3A52' },
};

function normalizeSearchText(value: string) {
  return value
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

/* Màu huy hiệu điểm: A xanh lá, B xanh dương, C vàng, D cam, F đỏ, P tím (đạt, không tính GPA) */
const GRADE_STYLE: Record<string, { bg: string; fg: string; border: string }> = {
  A: { bg: '#F0FDF4', fg: '#16A34A', border: '#DCFCE7' },
  B: { bg: '#EFF6FF', fg: '#2563EB', border: '#DBEAFE' },
  C: { bg: '#FFFBEB', fg: '#D97706', border: '#FEF3C7' },
  D: { bg: '#FFF7ED', fg: '#EA580C', border: '#FFEDD5' },
  F: { bg: '#FEF2F2', fg: '#DC2626', border: '#FEE2E2' },
  P: { bg: '#F5F3FF', fg: '#7C3AED', border: '#EDE9FE' },
  none: { bg: '#F8FAFC', fg: '#94A3B8', border: '#F1F5F9' },
};

function GradeBadge({ letter, compact = false }: { letter: CourseGrade['letter']; compact?: boolean }) {
  const { isDark } = useAppTheme();
  const styles = useAdaptiveStyles(baseStyles);
  const palette = isDark ? DARK_GRADE_STYLE[letter ?? 'none'] : GRADE_STYLE[letter ?? 'none'];
  return (
    <View
      style={[
        styles.gradeBadge,
        compact && styles.gradeBadgeCompact,
        { backgroundColor: palette.bg, borderColor: palette.border },
      ]}
    >
      <Text style={[styles.gradeBadgeText, compact && styles.gradeBadgeTextCompact, { color: palette.fg }]}>
        {letter ?? (compact ? '—' : 'Chưa có điểm')}
      </Text>
    </View>
  );
}

/* Hàng điểm giống web trường: ĐBP | Thi 1 | Thi 2 | Đ1 | Đ2 | Điểm chữ (ở cuối) */
function ScoreStrip({ scores, letter }: { scores: CourseGrade['scores']; letter: CourseGrade['letter'] }) {
  const styles = useAdaptiveStyles(baseStyles);
  const items = [
    { label: 'ĐBP', value: scores.process },
    { label: 'Thi 1', value: scores.exam1 },
    { label: 'Thi 2', value: scores.exam2 },
    { label: 'Đ1', value: scores.total1 },
    { label: 'Đ2', value: scores.total2 },
  ];
  return (
    <View style={styles.scoreStrip}>
      {items.map(item => (
        <View key={item.label} style={styles.scoreCell}>
          <Text style={styles.scoreLabel}>{item.label}</Text>
          <Text style={styles.scoreValue}>{item.value || '—'}</Text>
        </View>
      ))}
      <GradeBadge letter={letter} compact />
    </View>
  );
}

export default function GradesScreen() {
  const { isDark } = useAppTheme();
  const styles = useAdaptiveStyles(baseStyles);
  const { user, grades, isSyncing, syncErrors } = useAuth();
  const [courseSearch, setCourseSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('semester');
  const [selectedYear, setSelectedYear] = useState<string>('');

  const courses = useMemo(() => grades ? parseCourseGrades(grades.tables) : [], [grades]);
  const gradeSummary = useMemo(() => calculateGpa(courses), [courses]);

  const searchedCourses = useMemo(() => {
    const query = normalizeSearchText(courseSearch.trim());
    return courses.filter(course =>
      normalizeSearchText(`${course.subject} ${course.code} ${course.semester}`).includes(query)
    );
  }, [courseSearch, courses]);

  // Danh sách năm học (mới nhất trước) cho bộ lọc
  const years = useMemo(() => {
    const set = new Set(courses.map(course => course.year).filter(Boolean));
    return [...set].sort((a, b) => (parseInt(b, 10) || 0) - (parseInt(a, 10) || 0));
  }, [courses]);

  // Chế độ theo học kỳ luôn hiển thị một năm học: mặc định là năm mới nhất
  const activeYear = years.includes(selectedYear) ? selectedYear : (years[0] ?? '');

  // Gom học phần theo từng học kỳ (mỗi học kỳ một card)
  const semesterGroups = useMemo<SemesterGroup[]>(() => {
    const source = activeYear
      ? searchedCourses.filter(course => course.year === activeYear)
      : searchedCourses;
    const map = new Map<string, CourseGrade[]>();
    for (const course of source) {
      const key = course.semester || 'Khác';
      map.set(key, [...(map.get(key) ?? []), course]);
    }

    return [...map.entries()]
      .map(([key, list]) => {
        const first = list[0];
        const year = parseInt(first.year, 10) || 0;
        const term = parseInt(first.term, 10) || 0;
        return {
          key,
          title: first.term ? `Học kỳ ${first.term}` : key,
          subtitle: first.year ? `Năm học ${first.year}` : '',
          courses: list,
          gpa: calculateSemesterGpa(list).gpa,
          registeredCredits: list.reduce((sum, item) => sum + (item.credits ?? 0), 0),
          earnedCredits: list.reduce(
            (sum, item) => sum + (item.letter && item.letter !== 'F' ? item.credits ?? 0 : 0), 0),
          sortKey: year * 10 + term,
        };
      })
      .sort((a, b) => b.sortKey - a.sortKey);
  }, [searchedCourses, activeYear]);

  const classification = classifyGpa(gradeSummary.gpa);

  return (
    <Screen>
      {/* TIÊU ĐỀ TRANG */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.subGreeting}>KẾT QUẢ HỌC TẬP</Text>
          <Text style={styles.pageTitle}>Bảng điểm sinh viên</Text>
        </View>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{user?.name?.trim().charAt(0).toUpperCase() ?? '?'}</Text>
        </View>
      </View>

      {/* THÔNG TIN SINH VIÊN */}
      <View style={styles.studentCard}>
        <View style={styles.studentInfoRow}>
          <View style={styles.studentAvatar}>
            <Ionicons name="person" size={20} color="#2563EB" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.studentName}>{user?.name ?? 'Sinh viên'}</Text>
            <Text style={styles.studentSub}>MSSV: {user?.studentId ?? '—'}</Text>
          </View>
          <View style={styles.tagStatus}>
            <Text style={styles.tagStatusText}>Đang học</Text>
          </View>
        </View>
      </View>

      {/* GPA VÀ TÍN CHỈ */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statTop}>
            <View style={styles.iconCircleBlue}>
              <Ionicons name="school" size={18} color="#2563EB" />
            </View>
            <Text style={styles.statLabel}>GPA</Text>
          </View>
          <Text style={styles.statValue}>
            {gradeSummary.gpa === null ? '—' : gradeSummary.gpa.toFixed(2)}
          </Text>
          <Text style={styles.statSubText}>
            {classification ? `Xếp loại ${classification}` : 'A=4 · B=3 · C=2 · D=1 · F=0'}
          </Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statTop}>
            <View style={styles.iconCircleGreen}>
              <Ionicons name="ribbon-outline" size={18} color="#16A34A" />
            </View>
            <Text style={styles.statLabel}>Tín chỉ</Text>
          </View>
          <Text style={styles.statValue}>
            {courses.length === 0 ? '—' : gradeSummary.earnedCredits}
          </Text>
          <Text style={styles.statSubText}>Tín chỉ đã đạt</Text>
        </View>
      </View>

      {/* CHUYỂN CHẾ ĐỘ XEM */}
      <View style={styles.segmented}>
        {([
          { id: 'semester', label: 'Theo học kỳ', icon: 'albums-outline' },
          { id: 'all', label: 'Tất cả', icon: 'list-outline' },
        ] as const).map(option => {
          const active = viewMode === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Xem ${option.label.toLowerCase()}`}
              style={[styles.segmentItem, active && styles.segmentItemActive]}
              onPress={() => setViewMode(option.id)}
            >
              <Ionicons name={option.icon} size={16} color={active ? '#FFFFFF' : '#64748B'} />
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* TÌM KIẾM */}
      <View style={styles.courseSearchBar}>
        <Ionicons name="search-outline" size={18} color="#64748B" style={{ marginRight: 8 }} />
        <TextInput
          value={courseSearch}
          onChangeText={setCourseSearch}
          placeholder="Tìm môn học hoặc mã học phần..."
          placeholderTextColor={isDark ? '#FFFFFF' : '#94A3B8'}
          style={styles.courseSearchInput}
        />
        {!!courseSearch && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Xóa từ khóa tìm môn"
            onPress={() => setCourseSearch('')}
            style={styles.clearSearchBtn}
          >
            <Text style={styles.clearSearchText}>Xóa</Text>
          </Pressable>
        )}
      </View>

      {/* LỌC THEO NĂM HỌC (chỉ ở chế độ theo học kỳ) */}
      {viewMode === 'semester' && years.length > 1 && (
        <View style={styles.yearChips}>
          {years.map(year => {
            const active = activeYear === year;
            return (
              <Pressable
                key={year}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.yearChip, active && styles.yearChipActive]}
                onPress={() => setSelectedYear(year)}
              >
                <Text style={[styles.yearChipText, active && styles.yearChipTextActive]}>
                  {`Năm ${year}`}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {isSyncing && !grades && (
        <View style={styles.emptyCard}>
          <ActivityIndicator color="#2563EB" />
          <Text style={styles.emptyTitle}>Đang đồng bộ bảng điểm</Text>
          <Text style={styles.emptySub}>Dữ liệu được tải theo mã sinh viên của bạn.</Text>
        </View>
      )}

      {!!syncErrors.grades && !isSyncing && (
        <View style={styles.emptyCard}>
          <Ionicons name="cloud-offline-outline" size={34} color="#C2410C" />
          <Text style={styles.emptyTitle}>Chưa tải được bảng điểm</Text>
          <Text style={styles.emptySub}>{syncErrors.grades}</Text>
        </View>
      )}

      {grades && (
        <>
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>
              {viewMode === 'semester'
                ? `Học kỳ (${semesterGroups.length})`
                : `Học phần (${searchedCourses.length})`}
            </Text>
            <Text style={styles.legendText}>P = Đạt, không tính GPA</Text>
          </View>

          {/* CHẾ ĐỘ THEO HỌC KỲ: MỖI HỌC KỲ MỘT CARD */}
          {viewMode === 'semester' && (
            <View style={styles.cardList}>
              {semesterGroups.map(group => (
                <View key={group.key} style={styles.semesterCard}>
                  <View style={styles.semesterHeader}>
                    <View style={styles.semesterIcon}>
                      <Ionicons name="calendar-outline" size={20} color="#2563EB" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.semesterTitle}>{group.title}</Text>
                      {!!group.subtitle && <Text style={styles.semesterSubtitle}>{group.subtitle}</Text>}
                    </View>
                    {group.gpa !== null && (
                      <View style={styles.semesterGpa}>
                        <Text style={styles.semesterGpaLabel}>GPA kỳ</Text>
                        <Text style={styles.semesterGpaValue}>{group.gpa.toFixed(2)}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.semesterMetaRow}>
                    <View style={styles.metaPill}>
                      <Ionicons name="book-outline" size={13} color="#64748B" />
                      <Text style={styles.metaPillText}>{group.courses.length} học phần</Text>
                    </View>
                    <View style={styles.metaPill}>
                      <Ionicons name="ribbon-outline" size={13} color="#64748B" />
                      <Text style={styles.metaPillText}>
                        Đạt {group.earnedCredits}/{group.registeredCredits} tín chỉ
                      </Text>
                    </View>
                  </View>

                  <View style={styles.semesterCourses}>
                    {group.courses.map((course, index) => (
                      <View
                        key={course.id}
                        style={[styles.courseRow, index > 0 && styles.courseRowDivider]}
                      >
                        <Text style={styles.rowCourseName} numberOfLines={2}>{course.subject}</Text>
                        <Text style={styles.rowCourseMeta}>
                          {[course.code, course.credits !== null ? `${course.credits} TC` : '']
                            .filter(Boolean)
                            .join(' · ')}
                        </Text>
                        <ScoreStrip scores={course.scores} letter={course.letter} />
                      </View>
                    ))}
                  </View>
                </View>
              ))}

              {semesterGroups.length === 0 && (
                <View style={styles.emptyCard}>
                  <Ionicons name="search-outline" size={36} color="#94A3B8" />
                  <Text style={styles.emptyTitle}>
                    {courseSearch ? 'Không tìm thấy học phần' : 'Chưa có dữ liệu điểm'}
                  </Text>
                  <Text style={styles.emptySub}>
                    {courseSearch
                      ? `Không có học phần khớp với “${courseSearch}”.`
                      : 'Cổng thông tin trường chưa trả về học phần nào.'}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* CHẾ ĐỘ XEM TẤT CẢ: MỖI HỌC PHẦN MỘT CARD */}
          {viewMode === 'all' && (
            <View style={styles.cardList}>
              {searchedCourses.map(course => (
                <View key={course.id} style={styles.courseCard}>
                  <View style={styles.courseCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.courseName}>{course.subject}</Text>
                      {!!(course.code || course.semester) && (
                        <Text style={styles.courseCodeRow}>
                          {[course.code, course.semester].filter(Boolean).join(' · ')}
                        </Text>
                      )}
                    </View>
                  </View>

                  <ScoreStrip scores={course.scores} letter={course.letter} />

                  <View style={styles.chipsRow}>
                    {course.credits !== null && (
                      <View style={styles.chip}>
                        <Text style={styles.chipText}>Tín chỉ: <Text style={styles.chipBold}>{course.credits}</Text></Text>
                      </View>
                    )}
                    {course.details.map(detail => (
                      <View key={`${course.id}-${detail.label}`} style={styles.chip}>
                        <Text style={styles.chipText}>{detail.label}: <Text style={styles.chipBold}>{detail.value}</Text></Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}

              {searchedCourses.length === 0 && (
                <View style={styles.emptyCard}>
                  <Ionicons name="search-outline" size={36} color="#94A3B8" />
                  <Text style={styles.emptyTitle}>
                    {courseSearch ? 'Không tìm thấy học phần' : 'Chưa có dữ liệu điểm'}
                  </Text>
                  <Text style={styles.emptySub}>
                    {courseSearch
                      ? `Không có học phần khớp với “${courseSearch}”.`
                      : 'Cổng thông tin trường chưa trả về học phần nào.'}
                  </Text>
                </View>
              )}
            </View>
          )}
        </>
      )}

      <View style={{ height: 24 }} />
    </Screen>
  );
}

/* ===== Bóng đổ và bo góc dùng chung ===== */
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

const baseStyles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subGreeting: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 0.5,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#DBEAFE',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: CARD_RADIUS,
    padding: 16,
    ...cardShadow,
  },
  studentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  studentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  studentSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  tagStatus: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  tagStatusText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '700',
  },

  /* Thống kê */
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
  statSubText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },

  /* Chuyển chế độ xem */
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#E8EEF7',
    borderRadius: 16,
    padding: 4,
    marginTop: 20,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  segmentItemActive: {
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },

  /* Tìm kiếm và lọc năm */
  courseSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    marginTop: 14,
    ...cardShadow,
  },
  courseSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  clearSearchBtn: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  clearSearchText: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 12,
  },
  yearChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 14,
  },
  yearChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  yearChipActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#BFDBFE',
  },
  yearChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  yearChipTextActive: {
    color: '#1D4ED8',
    fontWeight: '800',
  },

  /* Danh sách */
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  legendText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  cardList: {
    gap: 14,
  },

  /* Card học kỳ */
  semesterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: CARD_RADIUS + 2,
    padding: 16,
    ...cardShadow,
  },
  semesterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  semesterIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  semesterTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  semesterSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  semesterGpa: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  semesterGpaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  semesterGpaValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  semesterMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaPillText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  semesterCourses: {
    marginTop: 8,
  },
  courseRow: {
    paddingVertical: 12,
  },
  courseRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  rowCourseName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
  },
  rowCourseMeta: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },

  /* Hàng điểm thành phần */
  scoreStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  scoreCell: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  scoreValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },

  /* Huy hiệu điểm */
  gradeBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeBadgeCompact: {
    width: 40,
    height: 36,
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 12,
  },
  gradeBadgeText: {
    fontSize: 14,
    fontWeight: '800',
  },
  gradeBadgeTextCompact: {
    fontSize: 16,
  },

  /* Card từng học phần (chế độ Tất cả) */
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: CARD_RADIUS,
    padding: 16,
    gap: 12,
    ...cardShadow,
  },
  courseCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  courseName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 21,
  },
  courseCodeRow: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: {
    color: '#64748B',
    fontSize: 11,
  },
  chipBold: {
    color: '#0F172A',
    fontWeight: '700',
  },

  /* Trạng thái trống */
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: CARD_RADIUS,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    ...cardShadow,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
});
const styles = baseStyles;