import { request } from './http';
import type {
  CancelRequestPayload,
  CoordinatorRequestDetails,
  CoordinatorRequestSummary,
  CreateRequestPayload,
  EligibleDonorsResponse,
  PublicSosRequest,
  RecordDonationPayload,
  RequestFilters,
  UpdateRequestPayload,
} from '../types/request.types';

export function getSosRequests(): Promise<PublicSosRequest[]> {
  return request<PublicSosRequest[]>('/requests/sos');
}

export function getRequests(filters?: RequestFilters): Promise<CoordinatorRequestSummary[]> {
  const query = new URLSearchParams();

  if (filters?.status) query.set('status', filters.status);
  if (filters?.bloodType) query.set('bloodType', filters.bloodType);
  if (filters?.areaId) query.set('areaId', filters.areaId);
  if (filters?.urgency) query.set('urgency', filters.urgency);

  const queryString = query.toString();
  return request<CoordinatorRequestSummary[]>(
    queryString ? `/requests?${queryString}` : '/requests',
  );
}

export function getRequestById(requestId: string): Promise<CoordinatorRequestDetails> {
  return request<CoordinatorRequestDetails>(`/requests/${encodeURIComponent(requestId)}`);
}

export function createRequest(payload: CreateRequestPayload): Promise<CoordinatorRequestDetails> {
  return request<CoordinatorRequestDetails>('/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function updateRequest(
  requestId: string,
  payload: UpdateRequestPayload,
): Promise<CoordinatorRequestDetails> {
  return request<CoordinatorRequestDetails>(`/requests/${encodeURIComponent(requestId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function cancelRequest(
  requestId: string,
  payload: CancelRequestPayload,
): Promise<CoordinatorRequestDetails> {
  return request<CoordinatorRequestDetails>(`/requests/${encodeURIComponent(requestId)}/cancel`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function getEligibleDonors(requestId: string): Promise<EligibleDonorsResponse> {
  return request<EligibleDonorsResponse>(
    `/requests/${encodeURIComponent(requestId)}/eligible-donors`,
  );
}

export function recordDonation(
  requestId: string,
  payload: RecordDonationPayload,
): Promise<CoordinatorRequestDetails> {
  return request<CoordinatorRequestDetails>(`/requests/${encodeURIComponent(requestId)}/donations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
