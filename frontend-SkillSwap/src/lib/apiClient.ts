const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('skillswap_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage =
      data?.error?.message || data?.message || 'API Request failed';
    const err: any = new Error(errorMessage);
    err.code = data?.error?.code || 'API_ERROR';
    err.httpStatus = response.status;
    err.flaggedInput = data?.error?.flaggedInput;
    throw err;
  }

  return data as T;
}

export { API_BASE_URL };
