import type { ActivePledge } from '../types/donor.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

export const pledgesApi = {
  // POST /requests/:id/pledges
  async createPledge(requestId: string): Promise<ActivePledge> {
    const response = await fetch(`${API_BASE_URL}/requests/${requestId}/pledges`, {
      method: 'POST',
      headers: getHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to submit blood donation pledge.');
    }
    return data;
  },

  // PATCH /pledges/:id/withdraw
  async withdrawPledge(pledgeId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/pledges/${pledgeId}/withdraw`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to withdraw pledge.');
    }
  },
};