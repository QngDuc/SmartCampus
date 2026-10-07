import { useCallback, useEffect, useState } from 'react';

export type SchoolNotice = {
  id: string;
  title: string;
  url: string;
  publishedAt: string | null;
  description: string;
};

type NoticesResponse = {
  notices?: SchoolNotice[];
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export function useSchoolNotices() {
  const [notices, setNotices] = useState<SchoolNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [requestNumber, setRequestNumber] = useState(0);

  const retry = useCallback(() => setRequestNumber(number => number + 1), []);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(false);

    fetch(`${API_BASE_URL}/api/notices`)
      .then(async response => {
        if (!response.ok) throw new Error('Notice request failed');
        return response.json() as Promise<NoticesResponse>;
      })
      .then(data => {
        if (active) setNotices(Array.isArray(data.notices) ? data.notices : []);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [requestNumber]);

  return { notices, loading, error, retry };
}

export function formatNoticeDate(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('vi-VN');
}
