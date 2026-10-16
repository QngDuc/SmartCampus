import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '@/components/campus-ui';
import { useAuth } from '@/components/auth-provider';
import { calculateGpa, parseCourseGrades } from '@/utils/academic';

function normalizeSearchText(value: string) {
  return value
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

export default function GradesScreen() {
  const { user, grades, isSyncing, syncErrors } = useAuth();
  const [courseSearch, setCourseSearch] = useState('');
  const courses = useMemo(() => grades ? parseCourseGrades(grades.tables) : [], [grades]);
  const filteredCourses = useMemo(() => {
    const query = normalizeSearchText(courseSearch.trim());
    return courses.filter(course =>
      normalizeSearchText(`${course.subject} ${course.code} ${course.semester}`).includes(query)
    );
  }, [courseSearch, courses]);
  const gradeSummary = useMemo(() => calculateGpa(courses), [courses]);

  return (
    <Screen>
      {/* TIÊU ĐỀ TRANG */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.subGreeting}>KẾT QUẢ HỌC TẬP</Text>
          <Text style={styles.pageTitle}>Bảng điểm sinh viên</Text>
        </View>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{user?.name.trim().charAt(0).toUpperCase() ?? '?'}</Text>
        </View>
      </View>

      {/* THÔNG TIN TỔNG QUAN SINH VIÊN */}
      <View style={styles.studentCard}>
        <View style={styles.studentInfoRow}>
          <View style={styles.studentAvatar}>
            <Ionicons name="person" size={20} color="#2563EB" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.studentName}>
              {user?.name ?? 'Sinh viên'}
            </Text>
            <Text style={styles.studentSub}>
              MSSV: {user?.studentId ?? '—'}
            </Text>
          </View>
          <View style={styles.tagStatus}>
            <Text style={styles.tagStatusText}>Đang học</Text>
          </View>
        </View>
      </View>

      {/* HAI THẺ THỐNG KÊ GPA VÀ TÍN CHỈ (ĐỒNG BỘ NHƯ ẢNH TRANG CHỦ) */}
      <View style={styles.statsRow}>
        {/* THẺ GPA */}
        <View style={styles.statCard}>
          <View style={styles.statTop}>
            <View style={styles.iconCircleBlue}>
              <Ionicons name="school" size={17} color="#2563EB" />
            </View>
            <Text style={styles.statLabel}>GPA</Text>
          </View>
          <Text style={styles.statValue}>{gradeSummary.gpa === null ? '—' : gradeSummary.gpa.toFixed(2)}</Text>
          <Text style={styles.statSubText}>A=4 · B=3 · C=2 · D=1 · F=0</Text>
        </View>

        {/* THẺ TÍN CHỈ */}
        <View style={styles.statCard}>
          <View style={styles.statTop}>
            <View style={styles.iconCircleGreen}>
              <Ionicons name="ribbon-outline" size={17} color="#16A34A" />
            </View>
            <Text style={styles.statLabel}>Tín chỉ</Text>
          </View>
          <Text style={styles.statValue}>{gradeSummary.gpa === null ? '—' : gradeSummary.earnedCredits}</Text>
          <Text style={styles.statSubText}>Tín chỉ đạt</Text>
        </View>
      </View>

      {/* TÌM TRONG BẢNG ĐIỂM ĐÃ ĐỒNG BỘ */}
      <View style={styles.filterSection}>
        <View style={styles.courseSearchBar}>
          <Ionicons name="search-outline" size={18} color="#64748B" style={{ marginRight: 8 }} />
          <TextInput
            value={courseSearch}
            onChangeText={setCourseSearch}
            placeholder="Tìm môn học hoặc mã học phần..."
            placeholderTextColor="#94A3B8"
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

      </View>

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
          <View style={styles.courseListHeader}>
            <Text style={styles.sectionTitle}>Học phần ({filteredCourses.length})</Text>
          </View>
          <View style={{ gap: 12 }}>
            {filteredCourses.map(course => (
            <View key={course.id} style={styles.courseCard}>
              <View style={styles.courseCardHeader}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.courseName}>{course.subject}</Text>
                  {!!(course.code || course.semester) && <Text style={styles.courseCodeRow}>{[course.code, course.semester].filter(Boolean).join(' · ')}</Text>}
                </View>
                <View style={styles.gradeScoreBadge}>
                  <Text style={styles.gradeScoreBadgeText}>{course.letter ?? 'Chưa có điểm'}</Text>
                </View>
              </View>

              <View style={styles.chipsRow}>
                {course.credits !== null && <View style={styles.chip}><Text style={styles.chipText}>Tín chỉ: <Text style={styles.chipBold}>{course.credits}</Text></Text></View>}
                {course.details.map(detail => <View key={`${course.id}-${detail.label}`} style={styles.chip}><Text style={styles.chipText}>{detail.label}: <Text style={styles.chipBold}>{detail.value}</Text></Text></View>)}
              </View>
            </View>
          ))}

          {filteredCourses.length === 0 && (
            <View style={styles.emptyCard}>
              <Ionicons name="search-outline" size={36} color="#94A3B8" />
              <Text style={styles.emptyTitle}>{courseSearch ? 'Không tìm thấy học phần' : 'Chưa có dữ liệu điểm'}</Text>
              <Text style={styles.emptySub}>{courseSearch ? `Không có học phần khớp với “${courseSearch}”.` : 'Cổng thông tin trường chưa trả về học phần nào.'}</Text>
            </View>
          )}
          </View>
        </>
      )}

      <View style={{ height: 20 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
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
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  studentCard: {
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
  studentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  studentAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
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
  statSubText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 3,
  },
  searchContainerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  searchHelpText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  searchFormRow: {
    flexDirection: 'column',
    gap: 10,
    marginTop: 4,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
  },
  searchButton: {
    backgroundColor: '#2563EB',
    height: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowColor: '#2563EB',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  searchButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 10,
    padding: 10,
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 12,
    flex: 1,
  },
  filterSection: {
    gap: 10,
  },
  courseSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 46,
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
  semesterTabsList: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  semesterTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  semesterTabActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  semesterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  semesterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  courseListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 15,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  courseCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  courseName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 21,
  },
  courseCodeRow: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  courseSemester: {
    fontSize: 12,
    color: '#2563EB',
    marginTop: 2,
  },
  gradeScoreBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeScoreBadgeText: {
    color: '#1D4ED8',
    fontSize: 14,
    fontWeight: '800',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  chipText: {
    color: '#64748B',
    fontSize: 11,
  },
  chipBold: {
    color: '#0F172A',
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
});

