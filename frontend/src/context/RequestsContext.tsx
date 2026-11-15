import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import * as requestsApi from '../services/requests.api';
import { getAllDonors } from '../services/donors.api';
import type { CoordinatorDonorItem } from '../types/donor.types';
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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error
    && typeof error.message === 'string') return error.message;
  return 'Something went wrong. Please try again.';
}

// A read keeps only its key, version and pending promise; React state stays explicit below.
interface ReadTracker {
  key: string | null;
  version: number;
  pending: Promise<void> | null;
}

function createReadTracker(): ReadTracker {
  return { key: null, version: 0, pending: null };
}

function invalidateRead(read: ReadTracker) {
  read.version += 1;
  read.pending = null;
}

function getFiltersKey(filters?: RequestFilters): string {
  return JSON.stringify([
    filters?.status ?? null,
    filters?.bloodType ?? null,
    filters?.areaId ?? null,
    filters?.urgency ?? null,
  ]);
}

export function RequestsProvider({ children }: { children: ReactNode }) {
  const [sosRequests, setSosRequests] = useState<PublicSosRequest[]>([]);
  const [isSosLoading, setIsSosLoading] = useState(false);
  const [sosError, setSosError] = useState<string | null>(null);
  const [requests, setRequests] = useState<CoordinatorRequestSummary[]>([]);
  const [isRequestsLoading, setIsRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [currentRequest, setCurrentRequest] = useState<CoordinatorRequestDetails | null>(null);
  const [isRequestDetailsLoading, setIsRequestDetailsLoading] = useState(false);
  const [requestDetailsError, setRequestDetailsError] = useState<string | null>(null);
  const [eligibleDonorsResult, setEligibleDonorsResult] = useState<EligibleDonorsResponse | null>(null);
  const [isEligibleDonorsLoading, setIsEligibleDonorsLoading] = useState(false);
  const [eligibleDonorsError, setEligibleDonorsError] = useState<string | null>(null);
  const [allDonors, setAllDonors] = useState<CoordinatorDonorItem[]>([]);
  const [isAllDonorsLoading, setIsAllDonorsLoading] = useState(false);
  const [allDonorsError, setAllDonorsError] = useState<string | null>(null);
  const [isMutationLoading, setIsMutationLoading] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const sosRead = useRef(createReadTracker());
  const requestsRead = useRef(createReadTracker());
  const detailsRead = useRef(createReadTracker());
  const eligibleRead = useRef(createReadTracker());
  const donorsRead = useRef(createReadTracker());
  const filtersRef = useRef<RequestFilters | undefined>(undefined);
  const currentRequestRef = useRef<CoordinatorRequestDetails | null>(null);
  const mountedRef = useRef(false);
  const mutationPendingRef = useRef(false);
  const lifecycleRef = useRef(0);

  // Be ready before child pages start their useEffect loads.
  useLayoutEffect(() => {
    mountedRef.current = true;
    const reads = [sosRead.current, requestsRead.current, detailsRead.current, eligibleRead.current, donorsRead.current];
    return () => {
      mountedRef.current = false;
      mutationPendingRef.current = false;
      lifecycleRef.current += 1;
      reads.forEach(invalidateRead);
    };
  }, []);

  const loadSosRequests = useCallback((): Promise<void> => {
    if (!mountedRef.current) return Promise.resolve();
    const read = sosRead.current;
    const key = 'sos';
    if (read.key === key && read.pending) return read.pending;
    const version = ++read.version;
    if (read.key !== key) {
      setSosRequests([]);
    }
    read.key = key;
    setIsSosLoading(true);
    setSosError(null);

    const promise = (async () => {
      try {
        // A superseded effect (including StrictMode cleanup) must not start an API call.
        await Promise.resolve();
        if (!mountedRef.current || read.version !== version) return;
        const result = await requestsApi.getSosRequests();
        if (!mountedRef.current || read.version !== version) return;
        setSosRequests(result);
      } catch (error) {
        if (mountedRef.current && read.version === version) {
          setSosRequests([]);
          setSosError(getErrorMessage(error));
        }
      } finally {
        if (mountedRef.current && read.version === version) {
          read.pending = null;
          setIsSosLoading(false);
        }
      }
    })();
    read.pending = promise;
    return promise;
  }, []);

  const loadRequests = useCallback((filters?: RequestFilters): Promise<void> => {
    if (!mountedRef.current) return Promise.resolve();
    const selectedFilters = filters ? { ...filters } : undefined;
    filtersRef.current = selectedFilters;
    const read = requestsRead.current;
    const key = getFiltersKey(selectedFilters);
    if (read.key === key && read.pending) return read.pending;
    const version = ++read.version;
    if (read.key !== key) {
      setRequests([]);
    }
    read.key = key;
    setIsRequestsLoading(true);
    setRequestsError(null);

    const promise = (async () => {
      try {
        // A superseded effect (including StrictMode cleanup) must not start an API call.
        await Promise.resolve();
        if (!mountedRef.current || read.version !== version) return;
        const result = await requestsApi.getRequests(selectedFilters);
        if (!mountedRef.current || read.version !== version) return;
        setRequests(result);
      } catch (error) {
        if (mountedRef.current && read.version === version) {
          setRequests([]);
          setRequestsError(getErrorMessage(error));
        }
      } finally {
        if (mountedRef.current && read.version === version) {
          read.pending = null;
          setIsRequestsLoading(false);
        }
      }
    })();
    read.pending = promise;
    return promise;
  }, []);

  const loadRequestById = useCallback((requestId: string): Promise<void> => {
    if (!mountedRef.current) return Promise.resolve();
    const read = detailsRead.current;
    const key = requestId;
    if (read.key === key && read.pending) return read.pending;
    const version = ++read.version;
    if (read.key !== key) {
      setCurrentRequest(null);
      currentRequestRef.current = null;
    }
    read.key = key;
    setIsRequestDetailsLoading(true);
    setRequestDetailsError(null);

    const promise = (async () => {
      try {
        // A superseded effect (including StrictMode cleanup) must not start an API call.
        await Promise.resolve();
        if (!mountedRef.current || read.version !== version) return;
        const result = await requestsApi.getRequestById(requestId);
        if (!mountedRef.current || read.version !== version) return;
        setCurrentRequest(result);
        currentRequestRef.current = result;
      } catch (error) {
        if (mountedRef.current && read.version === version) {
          setCurrentRequest(null);
          currentRequestRef.current = null;
          setRequestDetailsError(getErrorMessage(error));
        }
      } finally {
        if (mountedRef.current && read.version === version) {
          read.pending = null;
          setIsRequestDetailsLoading(false);
        }
      }
    })();
    read.pending = promise;
    return promise;
  }, []);

  const loadEligibleDonors = useCallback((requestId: string): Promise<void> => {
    if (!mountedRef.current) return Promise.resolve();
    const read = eligibleRead.current;
    const key = requestId;
    if (read.key === key && read.pending) return read.pending;
    const version = ++read.version;
    if (read.key !== key) {
      setEligibleDonorsResult(null);
    }
    read.key = key;
    setIsEligibleDonorsLoading(true);
    setEligibleDonorsError(null);

    const promise = (async () => {
      try {
        // A superseded effect (including StrictMode cleanup) must not start an API call.
        await Promise.resolve();
        if (!mountedRef.current || read.version !== version) return;
        const result = await requestsApi.getEligibleDonors(requestId);
        if (!mountedRef.current || read.version !== version) return;
        setEligibleDonorsResult(result);
      } catch (error) {
        if (mountedRef.current && read.version === version) {
          setEligibleDonorsResult(null);
          setEligibleDonorsError(getErrorMessage(error));
        }
      } finally {
        if (mountedRef.current && read.version === version) {
          read.pending = null;
          setIsEligibleDonorsLoading(false);
        }
      }
    })();
    read.pending = promise;
    return promise;
  }, []);

  const loadAllDonors = useCallback((): Promise<void> => {
    if (!mountedRef.current) return Promise.resolve();
    const read = donorsRead.current;
    const key = 'all';
    if (read.key === key && read.pending) return read.pending;
    const version = ++read.version;
    if (read.key !== key) {
      setAllDonors([]);
    }
    read.key = key;
    setIsAllDonorsLoading(true);
    setAllDonorsError(null);

    const promise = (async () => {
      try {
        // A superseded effect (including StrictMode cleanup) must not start an API call.
        await Promise.resolve();
        if (!mountedRef.current || read.version !== version) return;
        const result = await getAllDonors();
        if (!mountedRef.current || read.version !== version) return;
        setAllDonors(result);
      } catch (error) {
        if (mountedRef.current && read.version === version) {
          setAllDonors([]);
          setAllDonorsError(getErrorMessage(error));
        }
      } finally {
        if (mountedRef.current && read.version === version) {
          read.pending = null;
          setIsAllDonorsLoading(false);
        }
      }
    })();
    read.pending = promise;
    return promise;
  }, []);

  const refreshAfterCreate = useCallback(async (): Promise<void> => {
    invalidateRead(requestsRead.current);
    const refreshes = [loadRequests(filtersRef.current)];
    if (sosRead.current.key !== null) {
      invalidateRead(sosRead.current);
      refreshes.push(loadSosRequests());
    }
    await Promise.all(refreshes);
  }, [loadRequests, loadSosRequests]);

  const refreshAfterRequestChange = useCallback(async (
    updated: CoordinatorRequestDetails,
    action: 'update' | 'cancel' | 'donation',
  ): Promise<void> => {
    const refreshes: Promise<void>[] = [];
    const selectedDetailsId = detailsRead.current.key;
    if (selectedDetailsId === null || selectedDetailsId === updated.id) {
      invalidateRead(detailsRead.current);
      detailsRead.current.key = updated.id;
      currentRequestRef.current = updated;
      setCurrentRequest(updated);
      setRequestDetailsError(null);
      refreshes.push(loadRequestById(updated.id));
    }

    // A donation can affect matching for another currently selected request.
    const eligibleId = eligibleRead.current.key;
    const refreshEligible = eligibleId !== null && (action === 'donation' || eligibleId === updated.id);
    if (refreshEligible) {
      invalidateRead(eligibleRead.current);
      setEligibleDonorsResult(null);
      setEligibleDonorsError(null);
      setIsEligibleDonorsLoading(false);
    }
    if (requestsRead.current.key !== null) {
      invalidateRead(requestsRead.current);
      refreshes.push(loadRequests(filtersRef.current));
    }
    if (sosRead.current.key !== null) {
      invalidateRead(sosRead.current);
      refreshes.push(loadSosRequests());
    }
    if (action === 'donation' && donorsRead.current.key !== null) {
      invalidateRead(donorsRead.current);
      refreshes.push(loadAllDonors());
    }
    await Promise.all(refreshes);

    if (!mountedRef.current || !refreshEligible || eligibleRead.current.key !== eligibleId) return;
    const latestDetails = currentRequestRef.current;
    const refreshedRequest = latestDetails?.id === updated.id ? latestDetails : updated;
    if (eligibleId === updated.id && refreshedRequest.status !== 'OPEN') {
      // The matching endpoint rejects closed requests; discard the previous result.
      invalidateRead(eligibleRead.current);
      eligibleRead.current.key = null;
      setEligibleDonorsResult(null);
      setEligibleDonorsError(null);
      setIsEligibleDonorsLoading(false);
    } else if (eligibleId !== null) {
      invalidateRead(eligibleRead.current);
      await loadEligibleDonors(eligibleId);
    }
  }, [loadRequestById, loadRequests, loadSosRequests, loadAllDonors, loadEligibleDonors]);

  const createRequest = useCallback(async (payload: CreateRequestPayload): Promise<CoordinatorRequestDetails | null> => {
    if (!mountedRef.current || mutationPendingRef.current) return null;
    const lifecycle = lifecycleRef.current;
    mutationPendingRef.current = true;
    setIsMutationLoading(true);
    setMutationError(null);
    try {
      const updated = await requestsApi.createRequest(payload);
      if (!mountedRef.current || lifecycle !== lifecycleRef.current) return null;
      await refreshAfterCreate();
      if (!mountedRef.current || lifecycle !== lifecycleRef.current) return null;
      return updated;
    } catch (error) {
      if (mountedRef.current && lifecycle === lifecycleRef.current) {
        setMutationError(getErrorMessage(error));
      }
      return null;
    } finally {
      if (mountedRef.current && lifecycle === lifecycleRef.current) {
        mutationPendingRef.current = false;
        setIsMutationLoading(false);
      }
    }
  }, [refreshAfterCreate]);

  const updateRequest = useCallback(async (requestId: string, payload: UpdateRequestPayload): Promise<boolean> => {
    if (!mountedRef.current || mutationPendingRef.current) return false;
    const lifecycle = lifecycleRef.current;
    mutationPendingRef.current = true;
    setIsMutationLoading(true);
    setMutationError(null);
    try {
      const updated = await requestsApi.updateRequest(requestId, payload);
      if (!mountedRef.current || lifecycle !== lifecycleRef.current) return false;
      await refreshAfterRequestChange(updated, 'update');
      if (!mountedRef.current || lifecycle !== lifecycleRef.current) return false;
      return true;
    } catch (error) {
      if (mountedRef.current && lifecycle === lifecycleRef.current) {
        setMutationError(getErrorMessage(error));
      }
      return false;
    } finally {
      if (mountedRef.current && lifecycle === lifecycleRef.current) {
        mutationPendingRef.current = false;
        setIsMutationLoading(false);
      }
    }
  }, [refreshAfterRequestChange]);

  const cancelRequest = useCallback(async (requestId: string, payload: CancelRequestPayload): Promise<boolean> => {
    if (!mountedRef.current || mutationPendingRef.current) return false;
    const lifecycle = lifecycleRef.current;
    mutationPendingRef.current = true;
    setIsMutationLoading(true);
    setMutationError(null);
    try {
      const updated = await requestsApi.cancelRequest(requestId, payload);
      if (!mountedRef.current || lifecycle !== lifecycleRef.current) return false;
      await refreshAfterRequestChange(updated, 'cancel');
      if (!mountedRef.current || lifecycle !== lifecycleRef.current) return false;
      return true;
    } catch (error) {
      if (mountedRef.current && lifecycle === lifecycleRef.current) {
        setMutationError(getErrorMessage(error));
      }
      return false;
    } finally {
      if (mountedRef.current && lifecycle === lifecycleRef.current) {
        mutationPendingRef.current = false;
        setIsMutationLoading(false);
      }
    }
  }, [refreshAfterRequestChange]);

  const recordDonation = useCallback(async (requestId: string, payload: RecordDonationPayload): Promise<boolean> => {
    if (!mountedRef.current || mutationPendingRef.current) return false;
    const lifecycle = lifecycleRef.current;
    mutationPendingRef.current = true;
    setIsMutationLoading(true);
    setMutationError(null);
    try {
      const updated = await requestsApi.recordDonation(requestId, payload);
      if (!mountedRef.current || lifecycle !== lifecycleRef.current) return false;
      await refreshAfterRequestChange(updated, 'donation');
      if (!mountedRef.current || lifecycle !== lifecycleRef.current) return false;
      return true;
    } catch (error) {
      if (mountedRef.current && lifecycle === lifecycleRef.current) {
        setMutationError(getErrorMessage(error));
      }
      return false;
    } finally {
      if (mountedRef.current && lifecycle === lifecycleRef.current) {
        mutationPendingRef.current = false;
        setIsMutationLoading(false);
      }
    }
  }, [refreshAfterRequestChange]);

  const clearMutationError = useCallback((): void => {
    if (mountedRef.current) setMutationError(null);
  }, []);

  const value = useMemo<RequestsContextValue>(() => ({
    sosRequests, isSosLoading, sosError, loadSosRequests,
    requests, isRequestsLoading, requestsError, loadRequests,
    currentRequest, isRequestDetailsLoading, requestDetailsError, loadRequestById,
    eligibleDonorsResult, isEligibleDonorsLoading, eligibleDonorsError, loadEligibleDonors,
    allDonors, isAllDonorsLoading, allDonorsError, loadAllDonors,
    isMutationLoading, mutationError, createRequest, updateRequest, cancelRequest,
    recordDonation, clearMutationError,
  }), [
    sosRequests, isSosLoading, sosError, loadSosRequests,
    requests, isRequestsLoading, requestsError, loadRequests,
    currentRequest, isRequestDetailsLoading, requestDetailsError, loadRequestById,
    eligibleDonorsResult, isEligibleDonorsLoading, eligibleDonorsError, loadEligibleDonors,
    allDonors, isAllDonorsLoading, allDonorsError, loadAllDonors,
    isMutationLoading, mutationError, createRequest, updateRequest, cancelRequest,
    recordDonation, clearMutationError,
  ]);

  return <RequestsContext.Provider value={value}>{children}</RequestsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- The team contract keeps this hook with its provider.
export function useRequests() {
  const context = useContext(RequestsContext);
  if (!context) throw new Error('useRequests must be used inside RequestsProvider');
  return context;
}
