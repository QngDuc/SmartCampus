import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { router } from 'expo-router';
import { showAlert } from '@/utils/feedback';
import {
  getCurrentUser,
  getStoredToken,
  isAccountDisabled,
  removeStoredToken,
  storeToken,
  updateCurrentUser,
  type AuthUser,
  type AuthSession,
} from '@/utils/auth';
import {
  summarizeSync,
  synchronizeAcademics,
  type AcademicSyncResult,
  type AcademicSyncSummary,
  type GradesData,
  type TimetableData,
} from '@/utils/academic';

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  timetable: TimetableData | null;
  grades: GradesData | null;
  isSyncing: boolean;
  syncSummary: AcademicSyncSummary | null;
  syncErrors: { timetable: string | null; grades: string | null };
  signIn: (session: AuthSession) => Promise<AcademicSyncSummary>;
  signOut: () => Promise<void>;
  updateProfile: (profile: Pick<AuthUser, 'name' | 'email' | 'className' | 'cohort' | 'major' | 'faculty' | 'avatar'>) => Promise<AuthUser>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timetable, setTimetable] = useState<TimetableData | null>(null);
  const [grades, setGrades] = useState<GradesData | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSummary, setSyncSummary] = useState<AcademicSyncSummary | null>(null);
  const [syncErrors, setSyncErrors] = useState({ timetable: null as string | null, grades: null as string | null });

  function applyAcademicResult(result: AcademicSyncResult) {
    setTimetable(result.timetable);
    setGrades(result.grades);
    setSyncErrors({ timetable: result.timetableError, grades: result.gradesError });
    setSyncSummary(summarizeSync(result));
  }

  // Khôi phục phiên khi mở lại app
  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const token = await getStoredToken();
        if (token) {
          const response = await getCurrentUser(token);
          if (active) {
            setUser(response.user);
            setIsLoading(false);
            setIsSyncing(true);
          }
          const academicResult = await synchronizeAcademics(response.user.studentId);
          if (active) applyAcademicResult(academicResult);
        }
      } catch (error) {
        if (isAccountDisabled(error)) {
          // Tài khoản đã bị khóa/xóa trong lúc app đóng
          await removeStoredToken();
          if (active) {
            setUser(null);
            setTimetable(null);
            setGrades(null);
          }
          showAlert('Tài khoản không khả dụng', error.message);
        }
        // Lỗi khác (mất mạng...): giữ token để không đăng xuất oan.
      } finally {
        if (active) {
          setIsLoading(false);
          setIsSyncing(false);
        }
      }
    }

    void restoreSession();
    return () => {
      active = false;
    };
  }, []);

  // Khi đang đăng nhập: kiểm tra định kỳ xem tài khoản có bị khóa/xóa không
  useEffect(() => {
    if (!user) return;
    let stopped = false;

    async function check() {
      try {
        const token = await getStoredToken();
        if (!token) return;
        await getCurrentUser(token);
      } catch (error) {
        if (!stopped && isAccountDisabled(error)) {
          stopped = true;
          await signOut();
          showAlert('Tài khoản không khả dụng', error.message);
          router.replace('/');
        }
      }
    }

    const timer = setInterval(check, 30000); // 30 giây một lần
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') void check();
    });

    return () => {
      stopped = true;
      clearInterval(timer);
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function signIn(session: AuthSession) {
    await storeToken(session.token);
    setIsSyncing(true);
    setTimetable(null);
    setGrades(null);
    setSyncSummary(null);
    setSyncErrors({ timetable: null, grades: null });

    let result: AcademicSyncSummary;
    try {
      const academicResult = await synchronizeAcademics(session.user.studentId);
      applyAcademicResult(academicResult);
      result = summarizeSync(academicResult);
    } finally {
      setIsSyncing(false);
    }

    setUser(session.user);
    return result;
  }

  async function signOut() {
    await removeStoredToken();
    setUser(null);
    setTimetable(null);
    setGrades(null);
    setSyncSummary(null);
    setSyncErrors({ timetable: null, grades: null });
  }

  async function updateProfile(
    profile: Pick<AuthUser, 'name' | 'email' | 'className' | 'cohort' | 'major' | 'faculty' | 'avatar'>,
  ) {
    const token = await getStoredToken();
    if (!token) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    const response = await updateCurrentUser(token, profile);
    setUser(response.user);
    return response.user;
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      timetable,
      grades,
      isSyncing,
      syncSummary,
      syncErrors,
      signIn,
      signOut,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth phải được dùng bên trong AuthProvider.');
  return context;
}
