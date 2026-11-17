import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Loading } from '../../components/common/Loading';
import { PageContainer } from '../../components/common/PageContainer';
import { BLOOD_TYPES, REQUEST_STATUSES, URGENCY_LEVELS } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useRequests } from '../../context/RequestsContext';
import type { BloodType } from '../../types/auth.types';
import type { CoordinatorRequestDetails, RequestFilters, RequestStatus, Urgency } from '../../types/request.types';
import { RequestFiltersBar } from './RequestFiltersBar';
import { RequestsTable } from './RequestsTable';
import { CreateRequestModal } from './CreateRequestModal';
import './RequestsPage.css';

const bloodTypes: readonly BloodType[] = BLOOD_TYPES;
const requestStatuses: readonly RequestStatus[] = REQUEST_STATUSES;
const urgencyLevels: readonly Urgency[] = URGENCY_LEVELS;

export function RequestsPage() {
  const { t, direction } = useLanguage();
  const { requests, isRequestsLoading, requestsError, loadRequests, isMutationLoading, clearMutationError } = useRequests();
  const { areas, isAreasLoading, authError, loadAreas } = useAuth();
  const hasRequestedAreas = useRef(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get('status');
  const bloodTypeParam = searchParams.get('bloodType');
  const urgencyParam = searchParams.get('urgency');
  const areaId = searchParams.get('areaId') || undefined;
  const status = requestStatuses.find((value) => value === statusParam);
  const bloodType = bloodTypes.find((value) => value === bloodTypeParam);
  const urgency = urgencyLevels.find((value) => value === urgencyParam);
  const hasInvalidFilters = Boolean(
    (statusParam && !status) || (bloodTypeParam && !bloodType) || (urgencyParam && !urgency),
  );
  const hasFilters = ['status', 'bloodType', 'areaId', 'urgency'].some((key) => searchParams.has(key));
  const filters: RequestFilters = { status, bloodType, areaId, urgency };

  useEffect(() => {
    if (!hasInvalidFilters) void loadRequests({ status, bloodType, areaId, urgency });
  }, [status, bloodType, areaId, urgency, hasInvalidFilters, loadRequests]);

  useEffect(() => {
    if (!hasRequestedAreas.current && areas.length === 0 && !isAreasLoading && !authError) {
      hasRequestedAreas.current = true;
      void loadAreas();
    }
  }, [areas.length, isAreasLoading, authError, loadAreas]);

  function handleFiltersChange(nextFilters: RequestFilters) {
    const nextParams = new URLSearchParams(searchParams);
    const keys = ['status', 'bloodType', 'areaId', 'urgency'] as const;
    for (const key of keys) {
      nextParams.delete(key);
      const value = nextFilters[key];
      if (value) nextParams.set(key, value);
    }
    if (nextParams.toString() !== searchParams.toString()) setSearchParams(nextParams);
  }

  function handleRetry() {
    void loadRequests(filters);
  }

  function handleOpenCreate() {
    clearMutationError();
    setSuccessMessage(null);
    setIsCreateOpen(true);
  }

  function handleResetFilters() {
    handleFiltersChange({});
  }

  function handleRetryAreas() {
    void loadAreas();
  }

  function handleCloseCreate() {
    setIsCreateOpen(false);
  }

  function handleCreateSuccess(request: CoordinatorRequestDetails) {
    setSuccessMessage(`Request ${request.patientReference} created successfully.`);
  }

  function renderRequestResults() {
    if (hasInvalidFilters) {
      return <ErrorMessage message="Some URL filters are invalid. Choose a supported value or reset filters." onRetry={handleResetFilters} />;
    }
    if (isRequestsLoading) return <Loading message="Loading blood requests..." />;
    if (requestsError) return <ErrorMessage message={requestsError} onRetry={handleRetry} />;
    if (requests.length === 0) {
      return (
        <EmptyState
          title="No blood requests found"
          description={hasFilters ? 'Try changing or resetting your filters.' : 'Blood requests will appear here when they are published.'}
        />
      );
    }
    return <RequestsTable requests={requests} />;
  }

  return (
    <div className="requests-page" dir={direction}>
      <p className="requests-page__eyebrow">{t('Request management')}</p>
      <PageContainer
        title={t('Blood bank coordinator dashboard')}
        subtitle={t('Track blood requests and find eligible donors.')}
        actions={(
          <Button type="button" variant="primary" disabled={isMutationLoading} onClick={handleOpenCreate}>
            Create SOS request
          </Button>
        )}
      >
        <div className="requests-page__content">
          {successMessage && <p className="requests-page__success" role="status">{successMessage}</p>}
          <section className="requests-page__filters" aria-label="Filter requests">
            <RequestFiltersBar
              filters={filters}
              areas={areas}
              isAreasLoading={isAreasLoading}
              hasFilters={hasFilters}
              onChange={handleFiltersChange}
              onReset={handleResetFilters}
            />
            {!isAreasLoading && areas.length === 0 && authError && (
              <ErrorMessage message={authError} onRetry={handleRetryAreas} />
            )}
          </section>

          <section className="requests-page__results" aria-label="Blood requests" aria-busy={isRequestsLoading}>
            {renderRequestResults()}
          </section>
        </div>
        <CreateRequestModal
          isOpen={isCreateOpen}
          onClose={handleCloseCreate}
          onSuccess={handleCreateSuccess}
        />
      </PageContainer>
    </div>
  );
}

export default RequestsPage;
