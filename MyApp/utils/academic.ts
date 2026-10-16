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
  credits: number | null;
  letter: 'A' | 'B' | 'C' | 'D' | 'F' | null;
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
  return normalized && /^[ABCDF]$/.test(normalized)
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
    const creditIndex = headers.findIndex(header => /tin chi|so tc|stc/i.test(header));
    const gradeIndexes = headers
      .map((header, index) => /diem|xep loai|grade|letter|chu/i.test(header) ? index : -1)
      .filter(index => index >= 0);

    return table.rows.flatMap((row, rowIndex) => {
      const fallbackSubjectIndex = row.findIndex((value, index) =>
        value?.trim() && index !== codeIndex && index !== creditIndex && !gradeIndexes.includes(index) && !/^\d+(?:[,.]\d+)?$/.test(value.trim())
      );
      const resolvedSubjectIndex = subjectIndex >= 0 ? subjectIndex : fallbackSubjectIndex;
      const subject = row[resolvedSubjectIndex]?.trim() || row[codeIndex]?.trim();
      if (!subject) return [];

      const gradeIndex = gradeIndexes.find(index => readLetter(row[index]) !== null) ?? -1;
      const letter = gradeIndex >= 0 ? readLetter(row[gradeIndex]) : null;
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
        semester: table.title,
        credits,
        letter,
        details,
      }];
    });
  });
}

export function calculateGpa(courses: CourseGrade[]) {
  let totalCredits = 0;
  let earnedCredits = 0;
  let weightedPoints = 0;

  for (const course of courses) {
    if (!course.letter || !course.credits) continue;
    totalCredits += course.credits;
    weightedPoints += gradePoints[course.letter] * course.credits;
    if (course.letter !== 'F') earnedCredits += course.credits;
  }

  return {
    gpa: totalCredits > 0 ? weightedPoints / totalCredits : null,
    earnedCredits,
    totalCredits,
  };
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