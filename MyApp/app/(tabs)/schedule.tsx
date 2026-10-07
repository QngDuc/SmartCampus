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
        <View style={[s.card, { marginTop: 20 }]}>
          <Text style={s.text}>{gradeError}</Text>
        </View>
      )}

      {mode === 'grades' && grades && (
        <View style={{ marginTop: 20, gap: 12 }}>
          <View style={s.card}>
            <Text style={s.heading}>Kết quả học tập</Text>
            <Text style={s.muted}>MSSV: {grades.studentId}</Text>
            <Text style={s.muted}>Dữ liệu lấy trực tiếp từ website trường.</Text>
          </View>

          {grades.tables.map((table, tableIndex) => (
            <View key={`${table.title}-${tableIndex}`} style={s.card}>
              {!!table.title && <Text style={s.heading}>{table.title}</Text>}
              {table.headers.length > 0 && table.rows.length === 0 && (
                <Text style={s.text}>{table.headers.join(' · ')}</Text>
              )}
              {table.rows.map((row, rowIndex) => (
                <View
                  key={`${tableIndex}-${rowIndex}`}
                  style={{
                    paddingVertical: 10,
                    borderTopWidth: rowIndex === 0 ? 0 : 1,
                    borderColor: '#E2E8F0',
                  }}
                >
                  {row.map((cell, cellIndex) => {
                    if (!cell) return null;
                    const label = table.headers[cellIndex];
                    return <Text
                      key={`${rowIndex}-${cellIndex}`}
                      style={cellIndex === 0 ? s.heading : s.text}
                    >
                      {label ? `${label}: ` : ''}{cell}
                    </Text>;
                  })}
                </View>
              ))}
            </View>
          ))}
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
