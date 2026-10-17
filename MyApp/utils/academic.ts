export type TimetableItem = {
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

export type TimetableData = {
  student: { id: string; name: string };
  schedules: TimetableItem[];
};

export type GradeTable = {
  title: string;
  headers: string[];
  rows: string[][];
};

export type GradesData = {
  studentId: string;
  tables: GradeTable[];
};

export type CourseGrade = {
  id: string;
  code: string;
  subject: string;
  semester: string;
  year: string;
  term: string;
  credits: number | null;
  /** P = đạt không phân mức (GDTC, GDQP-AN...), không tính vào GPA. */
  letter: 'A' | 'B' | 'C' | 'D' | 'F' | 'P' | null;
  details: { label: string; value: string }[];
};

export type AcademicSyncResult = {
  timetable: TimetableData | null;
  grades: GradesData | null;
  timetableError: string | null;
  gradesError: string | null;
};

export type AcademicSyncSummary = {
  timetableCount: number;
  courseCount: number;
  timetableError: string | null;
  gradesError: string | null;
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

/**
 * Quy đổi điểm chữ sang thang điểm 4 theo Quy chế đào tạo ĐH theo tín chỉ của
 * Trường Đại học Tây Nguyên (QĐ 1574/QĐ-ĐHTN, căn cứ Thông tư 08/2021/TT-BGDĐT):
 * A = 4, B = 3, C = 2, D = 1, F = 0.
 */
const gradePoints = { A: 4, B: 3, C: 2, D: 1, F: 0 } as const;

async function getJson<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`);
  } catch {
    throw new Error('Không thể kết nối máy chủ dữ liệu học tập.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Không thể đồng bộ dữ liệu học tập.');
  }
  return data as T;
}

export async function synchronizeAcademics(studentId: string): Promise<AcademicSyncResult> {
  const [timetableResult, gradesResult] = await Promise.allSettled([
    getJson<TimetableData>(`/api/timetable/${encodeURIComponent(studentId)}`),
    getJson<GradesData>(`/api/grades/${encodeURIComponent(studentId)}`),
  ]);

  const timetable = timetableResult.status === 'fulfilled' && Array.isArray(timetableResult.value.schedules)
    ? timetableResult.value
    : null;
  const grades = gradesResult.status === 'fulfilled' && Array.isArray(gradesResult.value.tables)
    ? gradesResult.value
    : null;

  return {
    timetable,
    grades,
    timetableError: timetable
      ? null
      : timetableResult.status === 'rejected'
        ? timetableResult.reason instanceof Error ? timetableResult.reason.message : 'Không thể tải thời khóa biểu.'
        : 'Dữ liệu thời khóa biểu không đúng định dạng.',
    gradesError: grades
      ? null
      : gradesResult.status === 'rejected'
        ? gradesResult.reason instanceof Error ? gradesResult.reason.message : 'Không thể tải bảng điểm.'
        : 'Dữ liệu bảng điểm không đúng định dạng.',
  };
}

function readLetter(value: string | undefined): CourseGrade['letter'] {
  const normalized = value?.trim().toUpperCase();
  return normalized && /^[ABCDFP]$/.test(normalized)
    ? normalized as CourseGrade['letter']
    : null;
}

function readCredits(value: string | undefined) {
  if (!value) return null;
  const match = value.replace(',', '.').match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  const credits = Number(match[0]);
  return Number.isFinite(credits) && credits > 0 ? credits : null;
}

function readScore(value: string | undefined) {
  if (!value) return null;
  const match = value.trim().replace(',', '.').match(/^\d+(?:\.\d+)?$/);
  if (!match) return null;
  const score = Number(match[0]);
  return Number.isFinite(score) && score >= 0 && score <= 10 ? score : null;
}

/**
 * Điểm hệ 10 -> điểm chữ theo quy chế của trường:
 * A: 8,5-10 | B: 7,0-8,4 | C: 5,5-6,9 | D: 4,0-5,4 | F: dưới 4,0
 */
function letterFromScore(score: number | null): CourseGrade['letter'] {
  if (score === null) return null;
  const rounded = Math.round(score * 10) / 10;
  if (rounded >= 8.5) return 'A';
  if (rounded >= 7.0) return 'B';
  if (rounded >= 5.5) return 'C';
  if (rounded >= 4.0) return 'D';
  return 'F';
}

function normalizeHeader(value: string) {
  return value
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

export function parseCourseGrades(tables: GradeTable[]): CourseGrade[] {
  return tables.flatMap((table, tableIndex) => {
    const headers = table.headers.map(normalizeHeader);
    const subjectIndex = headers.findIndex(header => /ten.*(?:hoc phan|mon)|mon hoc/i.test(header));
    const codeIndex = headers.findIndex(header => /ma hoc phan|ma hp|ma mon/i.test(header));
    const creditIndex = headers.findIndex(header => /tin chi|so tc|stc|^tc$|^tchi$/i.test(header));
    // Cột điểm chữ / xếp loại (ví dụ "Điểm chữ", "ĐChữ", "Chữ"). Bỏ qua cột "Ghi chú".
    const gradeIndexes = headers
      .map((header, index) =>
        !/ghi chu/.test(header) && /diem|xep loai|grade|letter|^d?chu$/i.test(header.trim()) ? index : -1)
      .filter(index => index >= 0);

    // Bỏ qua bảng học phí/công nợ: có "Số tiền", "Tình trạng"... nhưng không có tín chỉ hay điểm
    const isFeeTable = creditIndex < 0 && gradeIndexes.length === 0
      && headers.some(header => /so tien|tinh trang|phai nop|da nop|con no|mien giam/.test(header));
    if (isFeeTable) return [];

    // Nhãn học kỳ: ưu tiên tiêu đề bảng, nếu trống thì ghép từ cột "Năm học" và "Kỳ"
    const yearIndex = headers.findIndex(header => /^nam hoc$/.test(header.trim()));
    const termIndex = headers.findIndex(header => /^(ky|hoc ky)$/.test(header.trim()));
    // Cột điểm số hệ 10 (dùng khi không đọc được điểm chữ)
    const scoreIndex = headers.findIndex(header =>
      /\bhe\s*10\b|tong ket|^diem tk|^tk\b|diem hp|diem hoc phan|diem so/i.test(header));

    return table.rows.flatMap((row, rowIndex) => {
      const fallbackSubjectIndex = row.findIndex((value, index) =>
        value?.trim() && index !== codeIndex && index !== creditIndex && !gradeIndexes.includes(index) && !/^\d+(?:[,.]\d+)?$/.test(value.trim())
      );
      const resolvedSubjectIndex = subjectIndex >= 0 ? subjectIndex : fallbackSubjectIndex;
      const subject = row[resolvedSubjectIndex]?.trim() || row[codeIndex]?.trim();
      if (!subject) return [];

      const gradeIndex = gradeIndexes.find(index => readLetter(row[index]) !== null) ?? -1;
      let letter = gradeIndex >= 0 ? readLetter(row[gradeIndex]) : null;

      // Dự phòng 1: quy đổi từ điểm hệ 10 nếu bảng không có điểm chữ
      if (!letter && scoreIndex >= 0) {
        letter = letterFromScore(readScore(row[scoreIndex]));
      }
      // Dự phòng 2: bảng không có tiêu đề cột điểm -> tìm ô chỉ chứa đúng một chữ A-F
      if (!letter && gradeIndexes.length === 0 && scoreIndex < 0) {
        const cell = row.find((value, index) =>
          index !== resolvedSubjectIndex && index !== codeIndex && index !== creditIndex && readLetter(value) !== null);
        letter = readLetter(cell);
      }

      const credits = readCredits(row[creditIndex]);
      const excludedIndexes = new Set([resolvedSubjectIndex, codeIndex, creditIndex, ...gradeIndexes]);
      const details = row.flatMap((value, index) => {
        const label = table.headers[index]?.trim();
        if (!value?.trim() || !label || excludedIndexes.has(index) || /diem|grade|score|xep loai|he\s*\d+/i.test(normalizeHeader(label))) return [];
        return [{ label, value: value.trim() }];
      });

      return [{
        id: `${tableIndex}-${rowIndex}`,
        code: codeIndex >= 0 ? row[codeIndex]?.trim() ?? '' : '',
        subject,
        semester: table.title?.trim()
          || [
            yearIndex >= 0 && row[yearIndex]?.trim() ? `Năm học ${row[yearIndex].trim()}` : '',
            termIndex >= 0 && row[termIndex]?.trim() ? `Kỳ ${row[termIndex].trim()}` : '',
          ].filter(Boolean).join(' - '),
        year: yearIndex >= 0 ? row[yearIndex]?.trim() ?? '' : '',
        term: termIndex >= 0 ? row[termIndex]?.trim() ?? '' : '',
        credits,
        letter,
        details,
      }];
    });
  });
}

/**
 * Học phần điều kiện (Giáo dục thể chất, Giáo dục quốc phòng - an ninh):
 * kết quả không dùng để tính điểm trung bình học kỳ và tích lũy.
 */
export function isConditionalCourse(course: Pick<CourseGrade, 'code' | 'subject'>) {
  const code = course.code.trim().toUpperCase();
  if (/^QP\d+/.test(code)) return true; // GDQP-AN: QP211006, QP211011, ...
  if (/^SP2110(3[2-9]|4[0-3])$/.test(code)) return true; // GDTC: SP211032 - SP211043

  const name = normalizeHeader(course.subject);
  return /giao duc the chat|giao duc quoc phong|duong loi quoc phong|cong tac quoc phong|quan su chung|ky thuat chien dau/.test(name)
    || /^(the duc co ban|the duc nhip dieu|bong chuyen|boi loi|cau long|bong ban|bong da|bong ro|co vua|taekwondo|teakwondo)/.test(name);
}

function courseKey(course: CourseGrade) {
  const code = course.code.trim().toUpperCase();
  return code || normalizeHeader(course.subject).trim();
}

/**
 * Mỗi học phần chỉ lấy một kết quả chính thức:
 * - Đã đạt (A-D) và học lại: lấy điểm cao nhất giữa các lần.
 * - Chưa đạt: lấy điểm của lần học cuối cùng.
 */
export function resolveFinalAttempts(courses: CourseGrade[]): CourseGrade[] {
  const groups = new Map<string, CourseGrade[]>();
  for (const course of courses) {
    if (!course.letter) continue;
    const key = courseKey(course);
    groups.set(key, [...(groups.get(key) ?? []), course]);
  }

  return [...groups.values()].map(attempts => {
    const passed = attempts.filter(item => item.letter !== 'F');
    if (passed.length === 0) return attempts[attempts.length - 1];
    const rank = (letter: NonNullable<CourseGrade['letter']>) =>
      letter === 'P' ? 1 : gradePoints[letter];
    return passed.reduce((best, item) =>
      rank(item.letter!) > rank(best.letter!) ? item : best);
  });
}

/**
 * Điểm trung bình tích lũy (GPA) theo quy chế:
 * - Chỉ tính các học phần đã tích lũy (điểm A, B, C, D), không tính F.
 * - Mỗi học phần lấy kết quả chính thức (xem resolveFinalAttempts).
 * - Không tính học phần điều kiện (GDTC, GDQP-AN) và các điểm I, X, R, P.
 * GPA = Σ(điểm hệ 4 × số tín chỉ) / Σ số tín chỉ.
 */
export function calculateGpa(courses: CourseGrade[]) {
  const finals = resolveFinalAttempts(courses);
  let gpaCredits = 0;
  let earnedCredits = 0;
  let weightedPoints = 0;

  for (const course of finals) {
    if (!course.letter || !course.credits || course.letter === 'F') continue;
    earnedCredits += course.credits;
    if (course.letter === 'P' || isConditionalCourse(course)) continue;
    gpaCredits += course.credits;
    weightedPoints += gradePoints[course.letter] * course.credits;
  }

  return {
    gpa: gpaCredits > 0 ? weightedPoints / gpaCredits : null,
    earnedCredits,
    totalCredits: gpaCredits,
  };
}

/**
 * Điểm trung bình học kỳ: tính trên các học phần sinh viên đăng ký trong học kỳ,
 * có cả học phần bị F (0 điểm), trọng số là số tín chỉ. Truyền vào danh sách
 * học phần của MỘT học kỳ.
 */
export function calculateSemesterGpa(courses: CourseGrade[]) {
  let totalCredits = 0;
  let weightedPoints = 0;

  for (const course of courses) {
    if (!course.letter || course.letter === 'P' || !course.credits || isConditionalCourse(course)) continue;
    totalCredits += course.credits;
    weightedPoints += gradePoints[course.letter] * course.credits;
  }

  return {
    gpa: totalCredits > 0 ? weightedPoints / totalCredits : null,
    totalCredits,
  };
}

/** Xếp loại học lực theo thang điểm 4 của quy chế. */
export function classifyGpa(gpa: number | null) {
  if (gpa === null) return null;
  if (gpa >= 3.6) return 'Xuất sắc';
  if (gpa >= 3.2) return 'Giỏi';
  if (gpa >= 2.5) return 'Khá';
  if (gpa >= 2.0) return 'Trung bình';
  if (gpa >= 1.0) return 'Yếu';
  return 'Kém';
}

/** Dùng để kiểm tra nhanh vì sao GPA không hiện: console.log(describeGradeParsing(grades.tables)). */
export function describeGradeParsing(tables: GradeTable[]) {
  const courses = parseCourseGrades(tables);
  const withLetter = courses.filter(course => course.letter !== null).length;
  const withCredits = courses.filter(course => course.credits !== null).length;
  return [
    `Số bảng: ${tables.length}`,
    `Học phần đọc được: ${courses.length}`,
    `Có điểm chữ: ${withLetter}`,
    `Có số tín chỉ: ${withCredits}`,
    `Tiêu đề cột: ${tables.map(table => table.headers.join(' | ')).join(' // ')}`,
  ].join('\n');
}

export function summarizeSync(result: AcademicSyncResult): AcademicSyncSummary {
  return {
    timetableCount: result.timetable?.schedules.length ?? 0,
    courseCount: result.grades ? parseCourseGrades(result.grades.tables).length : 0,
    timetableError: result.timetableError,
    gradesError: result.gradesError,
  };
}

export function describeSync(summary: AcademicSyncSummary) {
  const timetableMessage = summary.timetableError
    ? `Chưa tải được thời khóa biểu: ${summary.timetableError}`
    : `Thời khóa biểu: ${summary.timetableCount} buổi học.`;
  const gradesMessage = summary.gradesError
    ? `Chưa tải được bảng điểm: ${summary.gradesError}`
    : `Bảng điểm: ${summary.courseCount} học phần.`;
  return `${timetableMessage}\n${gradesMessage}`;
}