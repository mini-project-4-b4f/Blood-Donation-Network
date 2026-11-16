import type { CoordinatorDonorItem, DonorDashboardProfile, EligibleOpenRequest, UpdateDonorProfileDto } from '../types/donor.types';
import { request } from './http';

export const donorsApi = {
  getMyProfile: () => request<DonorDashboardProfile>('/donors/me'),

  updateMyProfile: (dto: UpdateDonorProfileDto) => request<DonorDashboardProfile>('/donors/me', {
    method: 'PATCH',
    body: JSON.stringify(dto),
  }),

  getEligibleRequests: () => request<EligibleOpenRequest[]>('/donors/me/eligible-requests'),

  deactivateAccount: () => request<{ message: string }>('/donors/me/deactivate', { method: 'PATCH' }),
};

export function getAllDonors(): Promise<CoordinatorDonorItem[]> {
  return request<CoordinatorDonorItem[]>('/donors');
}
