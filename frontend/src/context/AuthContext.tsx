import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import * as authApi from '../services/auth.api';
import { ApiError, clearStoredToken, getStoredToken, setStoredToken } from '../services/http';
import type { Area, AuthResponse, AuthUser, SignInPayload, SignUpPayload } from '../types/auth.types';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  areas: Area[];
  isAuthLoading: boolean;
  isAreasLoading: boolean;
  authError: string | null;
  loadAreas(): Promise<void>;
  loadCurrentUser(): Promise<void>;
  signIn(payload: SignInPayload): Promise<AuthUser | null>;
  signUp(payload: SignUpPayload): Promise<AuthUser | null>;
  signOut(): void;
  clearAuthError(): void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(getStoredToken);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState(() => Boolean(getStoredToken()));
  const [isAreasLoading, setIsAreasLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const sessionVersion = useRef(0);
  const areasVersion = useRef(0);
  const isSubmitting = useRef(false);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const signOut = useCallback(() => {
    // Invalidate older requests before clearing the session they might restore.
    sessionVersion.current += 1;
    isSubmitting.current = false;
    clearStoredToken();
    setToken(null);
    setUser(null);
    setAuthError(null);
    setIsAuthLoading(false);
  }, []);

  const loadCurrentUser = useCallback(async () => {
    const version = ++sessionVersion.current;
    const storedToken = getStoredToken();
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setIsAuthLoading(false);
      return;
    }
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const currentUser = await authApi.getMe();
      if (version !== sessionVersion.current) return;
      setUser(currentUser);
      setToken(storedToken);
    } catch (error) {
      if (version !== sessionVersion.current) return;
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        clearStoredToken();
        setToken(null);
        setUser(null);
      }
      setAuthError(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      if (version === sessionVersion.current) setIsAuthLoading(false);
    }
  }, []);

  const authenticate = useCallback(async (action: () => Promise<AuthResponse>) => {
    if (isSubmitting.current) return null;
    isSubmitting.current = true;
    const version = ++sessionVersion.current;
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const response = await action();
      if (version !== sessionVersion.current) return null;
      setStoredToken(response.accessToken);
      setToken(response.accessToken);
      setUser(response.user);
      return response.user;
    } catch (error) {
      if (version === sessionVersion.current) {
        setAuthError(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
      }
      return null;
    } finally {
      if (version === sessionVersion.current) {
        isSubmitting.current = false;
        setIsAuthLoading(false);
      }
    }
  }, []);

  const signIn = useCallback((payload: SignInPayload) => authenticate(() => authApi.signIn(payload)), [authenticate]);
  const signUp = useCallback((payload: SignUpPayload) => authenticate(() => authApi.signUpDonor(payload)), [authenticate]);

  const loadAreas = useCallback(async () => {
    const version = ++areasVersion.current;
    setIsAreasLoading(true);
    setAuthError(null);
    try {
      const result = await authApi.getAreas();
      if (version === areasVersion.current) setAreas(result);
    } catch (error) {
      if (version === areasVersion.current) {
        setAuthError(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
      }
    } finally {
      if (version === areasVersion.current) setIsAreasLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    // Start the external session check after mount; ignore a discarded StrictMode mount.
    void Promise.resolve().then(() => {
      if (active && getStoredToken()) return loadCurrentUser();
    });
    return () => {
      active = false;
      sessionVersion.current += 1;
      areasVersion.current += 1;
    };
  }, [loadCurrentUser]);

  const value = useMemo(() => ({
    user, token, areas, isAuthLoading, isAreasLoading, authError,
    loadAreas, loadCurrentUser, signIn, signUp, signOut, clearAuthError,
  }), [user, token, areas, isAuthLoading, isAreasLoading, authError, loadAreas, loadCurrentUser, signIn, signUp, signOut, clearAuthError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
