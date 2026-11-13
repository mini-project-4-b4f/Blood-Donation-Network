const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000/api';
const TOKEN_KEY = 'bdn.token';

const NETWORK_MESSAGE = 'Cannot reach the server. Please check your connection and try again.';
const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';

/** Fired when the server rejects a stored token (expired or user deactivated): AuthContext signs out. */
export const UNAUTHORIZED_EVENT = 'bdn:unauthorized';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage can be blocked (private mode): the session then lasts until the page is closed.
  }
}

export function clearStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing to clear.
  }
}

/** Human-readable text of any error (the backend `message` for an ApiError). */
export function getErrorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : FALLBACK_MESSAGE;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
}

function readMessage(data: unknown): string | null {
  if (typeof data === 'object' && data !== null && 'message' in data) {
    const message = (data as { message: unknown }).message;
    if (typeof message === 'string' && message) return message;
    if (Array.isArray(message) && typeof message[0] === 'string') return message[0];
  }
  return null;
}

/**
 * Every API call goes through here: attaches the Bearer token, parses JSON, and turns failures
 * (HTTP errors and network errors) into an ApiError that carries the backend `message`.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = getStoredToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: string | undefined;
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { method: options.method ?? 'GET', headers, body });
  } catch {
    throw new ApiError(0, NETWORK_MESSAGE);
  }

  let data: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    // A wrong password on the sign-in form is a 401 too: only a rejected stored token ends the session.
    const isSignInOrUp = path.startsWith('/auth/sign-');
    if (response.status === 401 && token && !isSignInOrUp) {
      clearStoredToken();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(response.status, readMessage(data) ?? FALLBACK_MESSAGE);
  }

  return data as T;
}
