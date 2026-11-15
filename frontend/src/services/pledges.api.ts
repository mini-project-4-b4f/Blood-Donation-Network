import type { ActivePledge } from '../types/donor.types';
import { request } from './http';

export const pledgesApi = {
  createPledge: (requestId: string) => request<ActivePledge>(`/requests/${encodeURIComponent(requestId)}/pledges`, { method: 'POST' }),

  withdrawPledge: (pledgeId: string) => request<void>(`/pledges/${encodeURIComponent(pledgeId)}/withdraw`, { method: 'PATCH' }),
};
