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
        Tra thời khóa biểu
      </Text>

      <Text style={s.muted}>
        Nhập mã sinh viên để xem lịch học.
      </Text>


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
            loading
              ? 'Đang tra cứu...'
              : 'Tra cứu'
          }

          disabled={loading}

          onPress={searchTimetable}
        />

        {loading && (
          <ActivityIndicator
            style={{
              marginTop: 10,
            }}
          />
        )}
      </View>


      {/* =====================================
          THÔNG TIN SINH VIÊN
      ====================================== */}

      {student && (
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

      {student &&
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

      {student &&
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