import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { getSosRequests } from '../services/requests.api';
import type { CoordinatorDonorItem } from '../types/donor.types';
import type { CancelRequestPayload, CoordinatorRequestDetails, CoordinatorRequestSummary, CreateRequestPayload, EligibleDonorsResponse, PublicSosRequest, RecordDonationPayload, RequestFilters, UpdateRequestPayload } from '../types/request.types';

interface RequestsContextValue {
  sosRequests: PublicSosRequest[];
  isSosLoading: boolean;
  sosError: string | null;
  loadSosRequests(): Promise<void>;
  requests: CoordinatorRequestSummary[];
  isRequestsLoading: boolean;
  requestsError: string | null;
  loadRequests(filters?: RequestFilters): Promise<void>;
  currentRequest: CoordinatorRequestDetails | null;
  isRequestDetailsLoading: boolean;
  requestDetailsError: string | null;
  loadRequestById(requestId: string): Promise<void>;
  eligibleDonorsResult: EligibleDonorsResponse | null;
  isEligibleDonorsLoading: boolean;
  eligibleDonorsError: string | null;
  loadEligibleDonors(requestId: string): Promise<void>;
  allDonors: CoordinatorDonorItem[];
  isAllDonorsLoading: boolean;
  allDonorsError: string | null;
  loadAllDonors(): Promise<void>;
  isMutationLoading: boolean;
  mutationError: string | null;
  createRequest(payload: CreateRequestPayload): Promise<CoordinatorRequestDetails | null>;
  updateRequest(requestId: string, payload: UpdateRequestPayload): Promise<boolean>;
  cancelRequest(requestId: string, payload: CancelRequestPayload): Promise<boolean>;
  recordDonation(requestId: string, payload: RecordDonationPayload): Promise<boolean>;
  clearMutationError(): void;
}

const RequestsContext = createContext<RequestsContextValue | undefined>(undefined);
const COORDINATOR_PENDING = 'Coordinator request actions are not connected yet.';

export function RequestsProvider({ children }: { children: ReactNode }) {
  const [sosRequests, setSosRequests] = useState<PublicSosRequest[]>([]);
  const [isSosLoading, setIsSosLoading] = useState(true);
  const [sosError, setSosError] = useState<string | null>(null);
  const requestVersion = useRef(0);

  const loadSosRequests = useCallback(async () => {
    const version = ++requestVersion.current;
    setIsSosLoading(true);
    setSosError(null);
    try {
      const result = await getSosRequests();
      if (version === requestVersion.current) setSosRequests(result);
    } catch (error) {
      if (version === requestVersion.current) setSosError(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      if (version === requestVersion.current) setIsSosLoading(false);
    }
  }, []);

  useEffect(() => () => { requestVersion.current += 1; }, []);

  // Preserve the full team contract without pretending the coordinator feature is implemented.
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [requestDetailsError, setRequestDetailsError] = useState<string | null>(null);
  const [eligibleDonorsError, setEligibleDonorsError] = useState<string | null>(null);
  const [allDonorsError, setAllDonorsError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const loadRequests = useCallback(async () => { setRequestsError(COORDINATOR_PENDING); }, []);
  const loadRequestById = useCallback(async () => { setRequestDetailsError(COORDINATOR_PENDING); }, []);
  const loadEligibleDonors = useCallback(async () => { setEligibleDonorsError(COORDINATOR_PENDING); }, []);
  const loadAllDonors = useCallback(async () => { setAllDonorsError(COORDINATOR_PENDING); }, []);
  const createRequest = useCallback(async () => { setMutationError(COORDINATOR_PENDING); return null; }, []);
  const unavailableMutation = useCallback(async () => { setMutationError(COORDINATOR_PENDING); return false; }, []);
  const clearMutationError = useCallback(() => setMutationError(null), []);

  const value = useMemo<RequestsContextValue>(() => ({
    sosRequests, isSosLoading, sosError, loadSosRequests,
    requests: [], isRequestsLoading: false, requestsError, loadRequests,
    currentRequest: null, isRequestDetailsLoading: false, requestDetailsError, loadRequestById,
    eligibleDonorsResult: null, isEligibleDonorsLoading: false, eligibleDonorsError, loadEligibleDonors,
    allDonors: [], isAllDonorsLoading: false, allDonorsError, loadAllDonors,
    isMutationLoading: false, mutationError, createRequest,
    updateRequest: unavailableMutation, cancelRequest: unavailableMutation, recordDonation: unavailableMutation,
    clearMutationError,
  }), [sosRequests, isSosLoading, sosError, loadSosRequests, requestsError, loadRequests, requestDetailsError, loadRequestById, eligibleDonorsError, loadEligibleDonors, allDonorsError, loadAllDonors, mutationError, createRequest, unavailableMutation, clearMutationError]);

  return <RequestsContext.Provider value={value}>{children}</RequestsContext.Provider>;
}

export function useRequests() {
  const context = useContext(RequestsContext);
  if (!context) throw new Error('useRequests must be used inside RequestsProvider');
  return context;
}
