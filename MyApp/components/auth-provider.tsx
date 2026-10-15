import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  getCurrentUser,
  getStoredToken,
  removeStoredToken,
  storeToken,
  type AuthSession,
  type AuthUser,
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
      } catch {
        // Keep the stored token so a temporary API outage does not sign the user out.
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