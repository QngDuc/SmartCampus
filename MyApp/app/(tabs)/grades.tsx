import { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen } from '@/components/campus-ui';
import { currentStudent, defaultGrades } from '@/data/mockData';
import { showAlert } from '@/utils/feedback';

type GradeTable = {
  title: string;
  headers: string[];
  rows: string[][];
};

type GradesResponse = {
  studentId: string;
  tables: GradeTable[];
};

function normalizeSearchText(value: string) {
  return value
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

export default function GradesScreen() {
  const [studentId, setStudentId] = useState(currentStudent.id);
  const [loading, setLoading] = useState(false);
  const [liveGrades, setLiveGrades] = useState<GradesResponse | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('Tất cả');

  // Tra cứu điểm từ server trường (giữ nguyên nút tìm kiếm và logic API)
  async function handleSearchGrades() {
    const msv = studentId.trim();
    setSearchError(null);
    setCourseSearch('');

    if (!msv) {
      showAlert('Thiếu mã sinh viên', 'Vui lòng nhập mã sinh viên để tra cứu.');
      return;
    }

    if (!/^\d{8}$/.test(msv)) {
      setSearchError('Mã sinh viên phải gồm 8 chữ số.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/grades/${msv}`);
      const data = (await response.json()) as GradesResponse & { message?: string };

      if (!response.ok) {
        throw new Error(data.message || 'Không thể lấy kết quả học tập từ hệ thống.');
      }

      if (!Array.isArray(data.tables)) {
        throw new Error('Dữ liệu điểm từ website trường không đúng định dạng.');
      }

      setLiveGrades(data);
    } catch (error) {
      console.log('Lỗi tra cứu điểm:', error);
      setSearchError(
        error instanceof Error
          ? error.message
          : 'Không thể kết nối đến máy chủ điểm. Vui lòng kiểm tra lại server hoặc dùng dữ liệu lưu sẵn.'
      );
    } finally {
      setLoading(false);
    }
  }

  // Danh sách môn học hiển thị (kết hợp dữ liệu trực tiếp hoặc mặc định của sinh viên)
  const isUsingLive = !!liveGrades;

  // Lọc dữ liệu bảng từ API trường nếu có
  const liveMatchingRows = useMemo(() => {
    if (!liveGrades) return [];
    return liveGrades.tables.flatMap((table, tableIndex) => {
      const courseIndex = table.headers.findIndex(h =>
        /học phần|môn học|tên môn|tên học phần/i.test(h)
      );
      const scoreIndex = table.headers.findIndex(h => /điểm|grade|score/i.test(h));
      const creditIndex = table.headers.findIndex(h => /tín chỉ|stc|tc/i.test(h));

      return table.rows
        .filter(row =>
          normalizeSearchText(row.join(' ')).includes(
            normalizeSearchText(courseSearch.trim())
          )
        )
        .map((row, rowIndex) => ({
          tableIndex,
          rowIndex,
          tableTitle: table.title,
          headers: table.headers,
          row,
          courseName: row[courseIndex >= 0 ? courseIndex : 0] || 'Học phần',
          score: scoreIndex >= 0 ? row[scoreIndex] : '',
          credits: creditIndex >= 0 ? row[creditIndex] : '',
        }));
    });
  }, [liveGrades, courseSearch]);

  // Lọc dữ liệu mặc định chuẩn theo môn và học kỳ
  const filteredDefaultGrades = useMemo(() => {
    return defaultGrades.filter(item => {
      const matchesSearch =
        normalizeSearchText(item.subject).includes(
          normalizeSearchText(courseSearch.trim())
        ) ||
        normalizeSearchText(item.code).includes(
          normalizeSearchText(courseSearch.trim())
        );

      const matchesSemester =
        selectedSemester === 'Tất cả' || item.semester === selectedSemester;

      return matchesSearch && matchesSemester;
    });
  }, [courseSearch, selectedSemester]);

  const semesters = ['Tất cả', 'HK1 (2026-2027)', 'HK2 (2025-2026)', 'HK1 (2025-2026)'];

  return (
    <Screen>
      {/* TIÊU ĐỀ TRANG */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.subGreeting}>KẾT QUẢ HỌC TẬP</Text>
          <Text style={styles.pageTitle}>Bảng điểm sinh viên</Text>
        </View>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{currentStudent.avatarChar}</Text>
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
              {isUsingLive ? `Sinh viên ${liveGrades.studentId}` : currentStudent.name}
            </Text>
            <Text style={styles.studentSub}>
              MSSV: {isUsingLive ? liveGrades.studentId : currentStudent.id} · {currentStudent.class}
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
          <Text style={styles.statValue}>{currentStudent.gpa}</Text>
          <Text style={styles.statSubText}>Thang điểm 4.0</Text>
        </View>

        {/* THẺ TÍN CHỈ */}
        <View style={styles.statCard}>
          <View style={styles.statTop}>
            <View style={styles.iconCircleGreen}>
              <Ionicons name="ribbon-outline" size={17} color="#16A34A" />
            </View>
            <Text style={styles.statLabel}>Tín chỉ</Text>
          </View>
          <Text style={styles.statValue}>{currentStudent.credits}</Text>
          <Text style={styles.statSubText}>
            {currentStudent.credits}/{currentStudent.totalCredits} TC tích lũy
          </Text>
        </View>
      </View>

      {/* KHUNG TRA CỨU ĐIỂM - VẪN GIỮ NGUYÊN NÚT TÌM KIẾM */}
      <View style={styles.searchContainerCard}>
        <Text style={styles.sectionTitle}>Tra cứu điểm theo MSSV</Text>
        <Text style={styles.searchHelpText}>
          Nhập mã sinh viên để tra cứu dữ liệu mới nhất từ cổng thông tin trường.
        </Text>

        <View style={styles.searchFormRow}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="id-card-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              value={studentId}
              onChangeText={setStudentId}
              placeholder="Nhập 8 chữ số, VD: 23103027"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              maxLength={8}
              style={styles.searchInput}
            />
            {!!studentId && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Xóa mã sinh viên"
                onPress={() => setStudentId('')}
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={18} color="#CBD5E1" />
              </Pressable>
            )}
          </View>

          {/* NÚT TÌM KIẾM ĐƯỢC GIỮ NGUYÊN VÀ THIẾT KẾ ĐẸP MẮT */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Nút tìm kiếm điểm sinh viên"
            style={[styles.searchButton, loading && styles.searchButtonDisabled]}
            disabled={loading}
            onPress={handleSearchGrades}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="search" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.searchButtonText}>Tra cứu điểm</Text>
              </>
            )}
          </Pressable>
        </View>

        {searchError && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={18} color="#DC2626" style={{ marginRight: 6 }} />
            <Text style={styles.errorBannerText}>{searchError}</Text>
          </View>
        )}
      </View>

      {/* THANH TÌM KIẾM TÊN MÔN HỌC & LỌC HỌC KỲ */}
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

        {!isUsingLive && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.semesterTabsList}
          >
            {semesters.map(sem => {
              const active = selectedSemester === sem;
              return (
                <Pressable
                  key={sem}
                  accessibilityRole="button"
                  onPress={() => setSelectedSemester(sem)}
                  style={[styles.semesterTab, active && styles.semesterTabActive]}
                >
                  <Text style={[styles.semesterTabText, active && styles.semesterTabTextActive]}>
                    {sem}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* DANH SÁCH HỌC PHẦN & ĐIỂM THI */}
      <View style={styles.courseListHeader}>
        <Text style={styles.sectionTitle}>
          {isUsingLive
            ? `Kết quả từ cổng trường (${liveMatchingRows.length} học phần)`
            : `Danh sách học phần (${filteredDefaultGrades.length})`}
        </Text>
      </View>

      {/* HIỂN THỊ KẾT QUẢ TỪ API TRƯỜNG NẾU CÓ */}
      {isUsingLive && (
        <View style={{ gap: 12 }}>
          {liveMatchingRows.map(
            ({ tableIndex, rowIndex, tableTitle, headers, row, courseName, score, credits }) => (
              <View key={`${tableIndex}-${rowIndex}`} style={styles.courseCard}>
                <View style={styles.courseCardHeader}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.courseName}>{courseName}</Text>
                    {!!tableTitle && <Text style={styles.courseSemester}>{tableTitle}</Text>}
                  </View>
                  {!!score && (
                    <View style={styles.gradeScoreBadge}>
                      <Text style={styles.gradeScoreBadgeText}>{score}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.chipsRow}>
                  {!!credits && (
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>
                        Số TC: <Text style={styles.chipBold}>{credits}</Text>
                      </Text>
                    </View>
                  )}
                  {row.map((cell, idx) => {
                    const header = headers[idx] || '';
                    if (!cell || /học phần|tên môn|điểm|stc|tín chỉ/i.test(header)) return null;
                    return (
                      <View key={`${rowIndex}-${idx}`} style={styles.chip}>
                        <Text style={styles.chipText}>
                          {header ? `${header}: ` : ''}
                          <Text style={styles.chipBold}>{cell}</Text>
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )
          )}

          {liveMatchingRows.length === 0 && (
            <View style={styles.emptyCard}>
              <Ionicons name="document-text-outline" size={36} color="#94A3B8" />
              <Text style={styles.emptyTitle}>Không tìm thấy học phần</Text>
              <Text style={styles.emptySub}>Thử tìm bằng từ khóa hoặc tên học phần khác.</Text>
            </View>
          )}
        </View>
      )}

      {/* HIỂN THỊ DỮ LIỆU ĐIỂM CHUẨN MẪU (THEO GIAO DIỆN NHƯ ẢNH) */}
      {!isUsingLive && (
        <View style={{ gap: 12 }}>
          {filteredDefaultGrades.map(item => (
            <View key={item.code} style={styles.courseCard}>
              <View style={styles.courseCardHeader}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.courseName}>{item.subject}</Text>
                  <Text style={styles.courseCodeRow}>
                    {item.code} · <Text style={{ color: '#2563EB' }}>{item.semester}</Text>
                  </Text>
                </View>
                <View style={styles.gradeScoreBadge}>
                  <Text style={styles.gradeScoreBadgeText}>
                    {item.score10} ({item.scoreLetter})
                  </Text>
                </View>
              </View>

              <View style={styles.chipsRow}>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>
                    Số TC: <Text style={styles.chipBold}>{item.credits}</Text>
                  </Text>
                </View>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>
                    Quá trình: <Text style={styles.chipBold}>{item.midterm}</Text>
                  </Text>
                </View>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>
                    Thi KTHP: <Text style={styles.chipBold}>{item.final}</Text>
                  </Text>
                </View>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>
                    Thang 4: <Text style={styles.chipBold}>{item.score4}</Text>
                  </Text>
                </View>
              </View>
            </View>
          ))}

          {filteredDefaultGrades.length === 0 && (
            <View style={styles.emptyCard}>
              <Ionicons name="search-outline" size={36} color="#94A3B8" />
              <Text style={styles.emptyTitle}>Không tìm thấy học phần</Text>
              <Text style={styles.emptySub}>Không có môn nào khớp với từ khóa &quot;{courseSearch}&quot;.</Text>
            </View>
          )}
        </View>
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

