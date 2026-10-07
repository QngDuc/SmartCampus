import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Screen, Button } from '@/components/campus-ui';
import { s } from '@/constants/campus';
import { days } from '@/data/mockData';
import { showAlert } from '@/utils/feedback';

type Student = {
  id: string;
  name: string;
};

type ScheduleItem = {
  day: string;
  date: string;
  session: string;
  subject: string;
  period: string;
  teacher: string;
  room: string;

  weekStart: string;
  weekEnd: string;
};

type TimetableResponse = {
  student: Student;
  schedules: ScheduleItem[];
};

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

const gradeColors = [
  { tint: '#F3E8FF', border: '#D8B4FE', accent: '#7E22CE', chip: '#FAF5FF' },
  { tint: '#CCFBF1', border: '#99F6E4', accent: '#0F766E', chip: '#F0FDFA' },
  { tint: '#FFEDD5', border: '#FED7AA', accent: '#C2410C', chip: '#FFF7ED' },
  { tint: '#DBEAFE', border: '#BFDBFE', accent: '#1D4ED8', chip: '#EFF6FF' },
];

// Chuyển dạng 28/09/2026 thành Date của JavaScript
function parseVietnamDate(value: string) {
  const [day, month, year] = value
    .split('/')
    .map(Number);

  return new Date(year, month - 1, day);
}

// Lấy thứ hiện tại
function getTodayName() {
  const today = new Date();

  const dayNumber = today.getDay();

  switch (dayNumber) {
    case 1:
      return 'Thứ 2';

    case 2:
      return 'Thứ 3';

    case 3:
      return 'Thứ 4';

    case 4:
      return 'Thứ 5';

    case 5:
      return 'Thứ 6';

    case 6:
      return 'Thứ 7';

    case 0:
      return 'CN';

    default:
      return 'Thứ 2';
  }
}

export default function ScheduleScreen() {
  const [mode, setMode] = useState<'schedule' | 'grades'>('schedule');
  const [studentId, setStudentId] = useState('');

  const [student, setStudent] =
    useState<Student | null>(null);

  const [scheduleList, setScheduleList] =
    useState<ScheduleItem[]>([]);

  const [selectedDay, setSelectedDay] =
    useState('Thứ 2');

  const [reminders, setReminders] =
    useState<string[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [gradesLoading, setGradesLoading] = useState(false);
  const [grades, setGrades] = useState<GradesResponse | null>(null);
  const [gradeError, setGradeError] = useState<string | null>(null);
  const [gradeSearch, setGradeSearch] = useState('');

  // ==========================================
  // TÌM TUẦN HIỆN TẠI
  // ==========================================

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const currentWeekSchedule =
    scheduleList.filter(item => {
      if (!item.weekStart || !item.weekEnd) {
        return false;
      }

      const start =
        parseVietnamDate(item.weekStart);

      const end =
        parseVietnamDate(item.weekEnd);

      start.setHours(0, 0, 0, 0);

      end.setHours(23, 59, 59, 999);

      return (
        today >= start &&
        today <= end
      );
    });

  // ==========================================
  // LỌC THEO NGÀY ĐANG CHỌN
  // ==========================================

  const lessons =
    currentWeekSchedule.filter(
      item => item.day === selectedDay
    );

  const filteredGradeTables = grades?.tables.map(table => ({
    ...table,
    rows: table.rows.filter(row =>
      normalizeSearchText(row.join(' ')).includes(normalizeSearchText(gradeSearch.trim()))
    ),
  })) ?? [];
  const matchingGradeRows = filteredGradeTables.flatMap((table, tableIndex) => {
    const courseIndex = table.headers.findIndex(header => /học phần|môn học|tên môn|tên học phần/i.test(header));
    const scoreIndex = table.headers.findIndex(header => /điểm|grade|score/i.test(header));
    return table.rows.map((row, rowIndex) => ({ table, tableIndex, row, rowIndex, courseIndex, scoreIndex }));
  });

  // ==========================================
  // TRA THỜI KHÓA BIỂU
  // ==========================================

  async function searchTimetable() {
    const msv = studentId.trim();

    if (msv === '') {
      showAlert(
        'Thiếu mã sinh viên',
        'Vui lòng nhập mã sinh viên.'
      );

      return;
    }

    if (!/^\d{8}$/.test(msv)) {
      showAlert(
        'Mã sinh viên không hợp lệ',
        'Mã sinh viên phải gồm 8 chữ số.'
      );

      return;
    }

    try {
      setLoading(true);

      /*
        Nếu chạy Expo Web:
        localhost dùng được.

        Nếu chạy trên điện thoại thật:
        phải đổi localhost thành IP máy tính.
      */
      const response = await fetch(
        `http://localhost:3000/api/timetable/${msv}`
      );

      if (!response.ok) {
        throw new Error(
          'Không thể lấy thời khóa biểu'
        );
      }

      const data: TimetableResponse =
        await response.json();

      setStudent(data.student);

      setScheduleList(
        Array.isArray(data.schedules)
          ? data.schedules
          : []
      );

      // Sau khi tra cứu,
      // tự chọn đúng thứ hôm nay.
      const todayName = getTodayName();

      setSelectedDay(todayName);

      // Reset nhắc lịch khi tra cứu MSSV khác
      setReminders([]);

    } catch (error) {
      console.log(error);

      showAlert(
        'Lỗi',
        'Không thể tra thời khóa biểu. Vui lòng thử lại.'
      );

    } finally {
      setLoading(false);
    }
  }

  async function searchGrades() {
    const msv = studentId.trim();
    setGrades(null);
    setGradeError(null);
    setGradeSearch('');

    if (!/^\d{8}$/.test(msv)) {
      setGradeError('Mã sinh viên phải gồm 8 chữ số.');
      return;
    }

    try {
      setGradesLoading(true);
      const response = await fetch(
        `http://localhost:3000/api/grades/${msv}`
      );
      const data = await response.json() as GradesResponse & { message?: string };

      if (!response.ok) {
        throw new Error(data.message || 'Không thể lấy kết quả học tập.');
      }

      if (!Array.isArray(data.tables)) {
        throw new Error('Dữ liệu điểm từ website trường không đúng định dạng.');
      }

      setGrades(data);
    } catch (error) {
      setGradeError(
        error instanceof Error
          ? error.message
          : 'Không thể lấy kết quả học tập. Vui lòng thử lại.'
      );
    } finally {
      setGradesLoading(false);
    }
  }

  // ==========================================
  // NHẮC LỊCH MÔ PHỎNG
  // ==========================================

  function remind(item: ScheduleItem) {
    const reminderId =
      `${item.date}-${item.subject}-${item.session}`;

    if (reminders.includes(reminderId)) {
      return;
    }

    setReminders([
      ...reminders,
      reminderId,
    ]);

    showAlert(
      'Nhắc lịch mô phỏng',
      'Đã bật nhắc lịch cho môn học này!'
    );
  }

  return (
    <Screen>

      {/* TIÊU ĐỀ */}
      <Text style={s.badge}>
        HỌC TẬP CÁ NHÂN
      </Text>

      <Text style={s.title}>
        Lịch học & điểm
      </Text>

      <Text style={s.muted}>
        Tra cứu từ hệ thống của Trường Đại học Tây Nguyên.
      </Text>

      <View style={[s.row, { marginTop: 18 }]}>
        {([
          { key: 'schedule', label: 'Lịch học' },
          { key: 'grades', label: 'Xem điểm' },
        ] as const).map(option => {
          const selected = mode === option.key;
          return <Pressable
            key={option.key}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={{
              flex: 1,
              alignItems: 'center',
              paddingVertical: 12,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: selected ? '#2563EB' : '#CBD5E1',
              backgroundColor: selected ? '#2563EB' : '#FFFFFF',
            }}
            onPress={() => setMode(option.key)}
          >
            <Text style={{ color: selected ? '#FFFFFF' : '#334155', fontWeight: '600' }}>
              {option.label}
            </Text>
          </Pressable>;
        })}
      </View>


      {/* =====================================
          Ô NHẬP MSSV
      ====================================== */}

      <View
        style={{
          marginTop: 20,
          gap: 10,
        }}
      >
        <Text style={s.label}>
          Mã sinh viên
        </Text>

        <TextInput
          value={studentId}

          onChangeText={setStudentId}

          placeholder="Ví dụ: 23103047"

          placeholderTextColor="#94A3B8"

          keyboardType="number-pad"

          maxLength={8}

          style={{
            height: 48,

            borderWidth: 1,

            borderColor: '#CBD5E1',

            borderRadius: 10,

            paddingHorizontal: 14,

            backgroundColor: '#F8FAFC',

            fontSize: 16,

            color: '#0F172A',
          }}
        />

        <Button
          title={
            loading || gradesLoading
              ? 'Đang tra cứu...'
              : mode === 'schedule'
                ? 'Tra thời khóa biểu'
                : 'Tra cứu điểm'
          }

          disabled={loading || gradesLoading}

          onPress={mode === 'schedule' ? searchTimetable : searchGrades}
        />

        {(loading || gradesLoading) && (
          <ActivityIndicator
            style={{
              marginTop: 10,
            }}
          />
        )}
      </View>


      {mode === 'grades' && gradeError && (
        <View style={[s.card, { marginTop: 20, backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}>
          <Text style={{ color: '#C2410C', fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>CHƯA THỂ TẢI ĐIỂM</Text>
          <Text style={[s.text, { color: '#7C2D12' }]}>{gradeError}</Text>
        </View>
      )}

      {mode === 'grades' && grades && (
        <View style={{ marginTop: 20, gap: 12 }}>
          <View style={{ backgroundColor: '#6D28D9', borderRadius: 20, padding: 18, gap: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#8B5CF6' }}>
            <View style={{ position: 'absolute', width: 120, height: 120, borderRadius: 60, right: -28, top: -38, backgroundColor: '#A78BFA', opacity: 0.45 }} />
            <View style={{ position: 'absolute', width: 72, height: 72, borderRadius: 36, right: 65, bottom: -45, backgroundColor: '#F0ABFC', opacity: 0.45 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ gap: 5 }}>
                <Text style={{ color: '#E9D5FF', fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>BẢNG ĐIỂM CỦA BẠN</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 21, fontWeight: '800' }}>Học tập thật vui ✨</Text>
              </View>
              <Text style={{ fontSize: 28 }}>🎓</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 3 }}>
              <View style={{ backgroundColor: '#FFFFFF24', borderRadius: 11, paddingHorizontal: 11, paddingVertical: 8 }}>
                <Text style={{ color: '#E9D5FF', fontSize: 10, fontWeight: '700' }}>MÃ SINH VIÊN</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800', marginTop: 2 }}>{grades.studentId}</Text>
              </View>
              <View style={{ backgroundColor: '#FFFFFF24', borderRadius: 11, paddingHorizontal: 11, paddingVertical: 8 }}>
                <Text style={{ color: '#E9D5FF', fontSize: 10, fontWeight: '700' }}>HỌC PHẦN</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '800', marginTop: 2 }}>{grades.tables.reduce((count, table) => count + table.rows.length, 0)} môn</Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1.5, borderColor: '#C4B5FD', paddingHorizontal: 12, minHeight: 48, shadowColor: '#7C3AED', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 }}>
            <Text style={{ fontSize: 17, marginRight: 8 }}>🔎</Text>
            <TextInput
              value={gradeSearch}
              onChangeText={setGradeSearch}
              placeholder="Tìm học phần có điểm..."
              placeholderTextColor="#94A3B8"
              returnKeyType="search"
              style={{ flex: 1, paddingVertical: 10, color: '#0F172A', fontSize: 14 }}
            />
            {!!gradeSearch && <Pressable accessibilityRole="button" accessibilityLabel="Xóa tìm kiếm" onPress={() => setGradeSearch('')} style={{ backgroundColor: '#F3E8FF', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 }}><Text style={{ color: '#7E22CE', fontWeight: '700', fontSize: 12 }}>Xóa</Text></Pressable>}
          </View>

          {matchingGradeRows.map(({ table, tableIndex, row, rowIndex, courseIndex, scoreIndex }) => (
            <View key={`${tableIndex}-${rowIndex}`} style={{ backgroundColor: gradeColors[rowIndex % gradeColors.length].chip, borderRadius: 16, borderWidth: 1.5, borderColor: gradeColors[rowIndex % gradeColors.length].border, padding: 13, gap: 10, shadowColor: gradeColors[rowIndex % gradeColors.length].accent, shadowOpacity: 0.08, shadowRadius: 7, shadowOffset: { width: 0, height: 3 }, elevation: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 11, backgroundColor: gradeColors[rowIndex % gradeColors.length].tint, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 17 }}>🌼</Text>
                  </View>
                  <Text style={{ color: '#0F172A', fontSize: 14, lineHeight: 20, fontWeight: '800', flex: 1 }}>{row[courseIndex >= 0 ? courseIndex : 0] || table.title || 'Học phần'}</Text>
                </View>
                {scoreIndex >= 0 && !!row[scoreIndex] && <View style={{ backgroundColor: gradeColors[rowIndex % gradeColors.length].accent, borderRadius: 11, paddingHorizontal: 11, paddingVertical: 7 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '900' }}>★ {row[scoreIndex]}</Text>
                </View>}
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {row.map((cell, cellIndex) => {
                  if (!cell) return null;
                  if (cellIndex === (courseIndex >= 0 ? courseIndex : 0) || cellIndex === scoreIndex) return null;
                  const header = table.headers[cellIndex];
                  return <View key={`${rowIndex}-${cellIndex}`} style={{ backgroundColor: '#FFFFFFB8', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6, borderWidth: 1, borderColor: gradeColors[rowIndex % gradeColors.length].border }}>
                    <Text style={{ color: '#64748B', fontSize: 11 }}>{header ? `${header}: ` : ''}<Text style={{ color: '#334155', fontWeight: '600' }}>{cell}</Text></Text>
                  </View>;
                })}
              </View>
            </View>
          ))}

          {filteredGradeTables.every(table => table.rows.length === 0) && (
            <View style={[s.card, { alignItems: 'center', paddingVertical: 24 }]}>
              <Text style={s.heading}>{gradeSearch ? 'Không tìm thấy học phần' : 'Chưa có dữ liệu điểm'}</Text>
              <Text style={[s.muted, { textAlign: 'center' }]}>{gradeSearch ? 'Thử tìm bằng tên học phần hoặc một phần tên khác.' : 'Cổng thông tin trường chưa trả về bảng kết quả cho mã sinh viên này.'}</Text>
            </View>
          )}
        </View>
      )}


      {/* =====================================
          THÔNG TIN SINH VIÊN
      ====================================== */}

      {mode === 'schedule' && student && (
        <View
          style={[
            s.card,
            {
              marginTop: 20,
            },
          ]}
        >
          <Text style={s.heading}>
            {student.name}
          </Text>

          <Text style={s.muted}>
            MSSV: {student.id}
          </Text>
        </View>
      )}


      {/* =====================================
          KHÔNG CÓ TUẦN HIỆN TẠI
      ====================================== */}

      {mode === 'schedule' && student &&
        currentWeekSchedule.length === 0 && (
          <View
            style={[
              s.card,
              {
                marginTop: 20,
              },
            ]}
          >
            <Text style={s.heading}>
              Bạn không có lịch học
            </Text>

            <Text style={s.muted}>
              Hiện chưa có thời khóa biểu
              cho tuần này.
            </Text>
          </View>
        )}


      {/* =====================================
          CÓ TUẦN HIỆN TẠI
      ====================================== */}

      {mode === 'schedule' && student &&
        currentWeekSchedule.length > 0 && (
          <>

            {/* CHỌN THỨ */}
            <ScrollView
              horizontal

              showsHorizontalScrollIndicator={
                false
              }

              contentContainerStyle={[
                s.row,
                {
                  marginTop: 20,
                },
              ]}
            >
              {days.map(day => (
                <Pressable
                  key={day}

                  accessibilityRole="button"

                  accessibilityState={{
                    selected:
                      selectedDay === day,
                  }}

                  style={[
                    s.day,

                    selectedDay === day &&
                      s.selected,
                  ]}

                  onPress={() =>
                    setSelectedDay(day)
                  }
                >
                  <Text
                    style={[
                      s.label,

                      selectedDay === day &&
                        s.white,
                    ]}
                  >
                    {day}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>


            {/* TIÊU ĐỀ NGÀY */}
            <Text style={s.heading}>
              {selectedDay} ·{' '}
              {lessons.length} môn học
            </Text>


            {/* KHÔNG CÓ MÔN TRONG NGÀY */}
            {lessons.length === 0 && (
              <View style={s.card}>
                <Text style={s.heading}>
                  Bạn không có lịch học
                </Text>

                <Text style={s.muted}>
                  {selectedDay} không có
                  môn học.
                </Text>
              </View>
            )}


            {/* =====================================
                DANH SÁCH MÔN HỌC
            ====================================== */}

            {lessons.map(
              (item, index) => {
                const reminderId =
                  `${item.date}-${item.subject}-${item.session}`;

                const reminded =
                  reminders.includes(
                    reminderId
                  );

                return (
                  <View
                    key={
                      `${item.date}-${item.subject}-${index}`
                    }

                    style={s.card}
                  >

                    {/* NGÀY + BUỔI */}
                    <Text style={s.badge}>
                      {item.date} ·{' '}
                      {item.session}
                    </Text>


                    {/* TÊN MÔN */}
                    <Text style={s.heading}>
                      {item.subject}
                    </Text>


                    {/* TIẾT */}
                    <Text style={s.muted}>
                      Tiết: {item.period}
                    </Text>


                    {/* GIẢNG VIÊN */}
                    <Text style={s.muted}>
                      Giảng viên:{' '}
                      {item.teacher}
                    </Text>


                    {/* PHÒNG */}
                    <Text style={s.muted}>
                      Phòng học:{' '}
                      {item.room}
                    </Text>


                    {/* NHẮC LỊCH */}
                    <Button
                      title={
                        reminded
                          ? 'Đã bật nhắc lịch'
                          : 'Nhắc lịch'
                      }

                      secondary

                      disabled={reminded}

                      onPress={() =>
                        remind(item)
                      }
                    />

                  </View>
                );
              }
            )}

          </>
        )}

    </Screen>
  );
}
