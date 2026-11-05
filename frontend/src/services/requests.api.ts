import type { PublicSosRequest } from '../types/request.types';
import { request } from './http';

// Public foundation only; coordinator API functions remain Rami's feature work.
export function getSosRequests(): Promise<PublicSosRequest[]> {
  return request<PublicSosRequest[]>('/requests/sos');
}
