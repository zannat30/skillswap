function getApiBaseUrl(): string {
  let url = (
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api'
  ).trim();
  // Remove trailing slashes
  url = url.replace(/\/+$/, '');
  // If the user did not include /api at the end, append it
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
}

const API_BASE_URL = getApiBaseUrl();

export function triggerDatabaseErrorPopup(message: string, code = 'DATABASE_ERROR') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('skillswap:database-error', {
        detail: { message, code }
      })
    );
  }
}

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

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${API_BASE_URL}${cleanEndpoint}`;

  let response: Response;
  try {
    response = await fetch(fullUrl, {
      ...options,
      headers
    });
  } catch (networkErr: any) {
    const errorMsg =
      'Data fetching error from database: Unable to reach backend server. Please verify your internet and backend status.';
    triggerDatabaseErrorPopup(errorMsg, 'CONNECTION_ERROR');
    const err: any = new Error(errorMsg);
    err.code = 'DATABASE_ERROR';
    err.httpStatus = 503;
    throw err;
  }

  let rawText = '';
  let data: any = {};
  try {
    rawText = await response.text();
    data = JSON.parse(rawText);
  } catch (_) {
    data = {};
  }

  if (!response.ok) {
    const errorMessage =
      data?.error?.message ||
      data?.message ||
      (response.status === 404
        ? `API endpoint not found (404) at ${fullUrl}. Please check backend URL in Vercel.`
        : `Request failed (${response.status}): ${rawText.slice(0, 120) || 'Server error'}`);
    const errorCode = data?.error?.code || 'API_ERROR';

    // If database connection error, 503, or database failure from backend
    if (
      errorCode === 'DATABASE_ERROR' ||
      response.status === 503 ||
      errorMessage.toLowerCase().includes('database') ||
      errorMessage.toLowerCase().includes('mongodb')
    ) {
      triggerDatabaseErrorPopup(errorMessage, errorCode);
    }

    const err: any = new Error(errorMessage);
    err.code = errorCode;
    err.httpStatus = response.status;
    err.flaggedInput = data?.error?.flaggedInput;
    throw err;
  }

  return data as T;
}

export { API_BASE_URL, getApiBaseUrl };
