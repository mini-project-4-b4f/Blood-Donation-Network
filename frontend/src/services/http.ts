const API_URL = (import.meta.env?.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
const TOKEN_KEY = 'bdn.token';
let sessionToken: string | null = null;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getStoredToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); }
  catch { return sessionToken; }
}

export function setStoredToken(token: string): void {
  sessionToken = token;
  try { localStorage.setItem(TOKEN_KEY, token); }
  catch { /* A blocked storage area must not break the current tab's session. */ }
}

export function clearStoredToken(): void {
  sessionToken = null;
  try { localStorage.removeItem(TOKEN_KEY); }
  catch { /* The in-memory session has already been cleared. */ }
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getStoredToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  let response: Response;
  try {
    response = await fetch(`${API_URL}/${path.replace(/^\//, '')}`, { ...options, headers });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Please check your connection and try again.');
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, typeof body?.message === 'string' ? body.message : 'Something went wrong. Please try again.');
  }
  if (body === null && response.status !== 204) throw new ApiError(response.status, 'Something went wrong. Please try again.');
  return body as T;
}
