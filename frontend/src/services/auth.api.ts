import type { Area, AuthResponse, AuthUser, SignInPayload, SignUpPayload } from '../types/auth.types';
import { request } from './http';

export function getAreas(): Promise<Area[]> {
  return request<Area[]>('/areas');
}

export function signUpDonor(payload: SignUpPayload): Promise<AuthResponse> {
  // Empty optional email values fail backend validation, so leave them out.
  const { email, ...requiredFields } = payload;
  const body = email?.trim() ? { ...requiredFields, email: email.trim().toLowerCase() } : requiredFields;
  return request<AuthResponse>('/auth/sign-up', { method: 'POST', body: JSON.stringify(body) });
}

export function signIn(payload: SignInPayload): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/sign-in', { method: 'POST', body: JSON.stringify(payload) });
}

export function getMe(): Promise<AuthUser> {
  return request<AuthUser>('/auth/me');
}
