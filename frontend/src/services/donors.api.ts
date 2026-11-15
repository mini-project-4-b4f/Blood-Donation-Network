import type { DonorDashboardProfile, EligibleOpenRequest, UpdateDonorProfileDto } from '../types/donor.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

export const donorsApi = {
  // GET /donors/me
  async getMyProfile(): Promise<DonorDashboardProfile> {
    const response = await fetch(`${API_BASE_URL}/donors/me`, {
      headers: getHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch donor profile.');
    }
    return data;
  },

  // PATCH /donors/me
  async updateMyProfile(dto: UpdateDonorProfileDto): Promise<DonorDashboardProfile> {
    const response = await fetch(`${API_BASE_URL}/donors/me`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(dto),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile.');
    }
    return data;
  },

  // GET /donors/me/eligible-requests
  async getEligibleRequests(): Promise<EligibleOpenRequest[]> {
    const response = await fetch(`${API_BASE_URL}/donors/me/eligible-requests`, {
      headers: getHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch eligible requests.');
    }
    return data;
  },

  // PATCH /donors/me/deactivate
  async deactivateAccount(): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/donors/me/deactivate`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to deactivate account.');
    }
    return data;
  },
};