import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type AuthUser = {
  id: string;
  studentId: string;
  name: string;
  email: string;
  className: string;
  cohort: string;
  major: string;
  faculty: string;
  avatar: string;
};

export type AuthSession = {
  user: AuthUser;
  token: string;
};

type AuthResponse = { user: AuthUser; token: string };
type UserResponse = { user: AuthUser };

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
const TOKEN_KEY = 'smart-campus-auth-token';

// Lỗi từ API, giữ lại mã lỗi (code) để phân biệt "bị khóa/xóa" với lỗi khác
export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function isAccountDisabled(error: unknown): error is ApiError {
  return (
    error instanceof ApiError &&
    (error.code === 'ACCOUNT_BLOCKED' || error.code === 'ACCOUNT_DELETED')
  );
}

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new Error('Không thể kết nối máy chủ. Hãy kiểm tra địa chỉ API và kết nối mạng.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 404 && path === '/api/auth/profile') {
      throw new ApiError(
        'API đang chạy phiên bản cũ. Hãy khởi động lại backend rồi thử lưu lại.',
        response.status,
      );
    }
    throw new ApiError(data.message || 'Yêu cầu không thành công.', response.status, data.code);
  }
  return data as T;
}

export function registerUser(input: {
  studentId: string;
  name: string;
  email: string;
  password: string;
}) {
  return request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function loginUser(input: { identifier: string; password: string }) {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getCurrentUser(token: string) {
  return request<UserResponse>('/api/auth/me', {}, token);
}

export function updateCurrentUser(
  token: string,
  profile: Pick<AuthUser, 'name' | 'email' | 'className' | 'cohort' | 'major' | 'faculty' | 'avatar'>,
) {
  return request<UserResponse>('/api/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(profile),
  }, token);
}

export async function getStoredToken() {
  if (Platform.OS === 'web') {
    return typeof window === 'undefined' ? null : window.sessionStorage.getItem(TOKEN_KEY);
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function storeToken(token: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.sessionStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function removeStoredToken() {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.sessionStorage.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
