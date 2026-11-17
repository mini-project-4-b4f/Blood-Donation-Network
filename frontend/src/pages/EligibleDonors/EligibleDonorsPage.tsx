import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BloodTypeBadge } from '../../components/common/BloodTypeBadge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Loading } from '../../components/common/Loading';
import { PageContainer } from '../../components/common/PageContainer';
import { StatusBadge } from '../../components/common/StatusBadge';
import { UrgencyBadge } from '../../components/common/UrgencyBadge';
import { useRequests } from '../../context/RequestsContext';
import { useLanguage } from '../../context/LanguageContext';
import type { CoordinatorRequestDetails } from '../../types/request.types';
import { formatUnits } from '../../utils/format';
import { RecordDonationModal } from '../RequestDetails/RecordDonationModal';
import { EligibleDonorRow } from './EligibleDonorRow';
import { ExcludedDonorsSummary } from './ExcludedDonorsSummary';
import './EligibleDonorsPage.css';

interface EligibleDonorsContentProps {
  requestId: string | undefined;
}

function EligibleDonorsContent({ requestId }: EligibleDonorsContentProps) {
  const { direction } = useLanguage();
  const {
    currentRequest, isRequestDetailsLoading, requestDetailsError, loadRequestById,
    eligibleDonorsResult, isEligibleDonorsLoading, eligibleDonorsError, loadEligibleDonors,
    isMutationLoading, clearMutationError,
  } = useRequests();
  const [hasLoadedRequest, setHasLoadedRequest] = useState(false);
  const [hasLoadedDonors, setHasLoadedDonors] = useState(false);
  const [recordingRequest, setRecordingRequest] = useState<CoordinatorRequestDetails | null>(null);
  const [preselectedDonorId, setPreselectedDonorId] = useState<string | undefined>();
  const [hasRecordedDonation, setHasRecordedDonation] = useState(false);
  const backLinkRef = useRef<HTMLAnchorElement>(null);
  const successRef = useRef<HTMLParagraphElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const wasRecordingRef = useRef(false);
  const currentRequestId = currentRequest?.id;
  const requestStatus = currentRequest?.status;

  useEffect(() => {
    let isActive = true;
    async function loadRequest() {
      if (!requestId) return;
      await loadRequestById(requestId);
      if (isActive) setHasLoadedRequest(true);
    }
    void loadRequest();
    return () => { isActive = false; };
  }, [requestId, loadRequestById]);

  useEffect(() => {
    let isActive = true;
    async function loadDonors() {
      // Closed requests cannot be matched. Context handles later refreshes after donations.
      if (!requestId || !hasLoadedRequest || currentRequestId !== requestId || requestStatus !== 'OPEN') return;
      await loadEligibleDonors(requestId);
      if (isActive) setHasLoadedDonors(true);
    }
    void loadDonors();
    return () => { isActive = false; };
  }, [requestId, hasLoadedRequest, currentRequestId, requestStatus, loadEligibleDonors]);

  useEffect(() => {
    if (recordingRequest) {
      wasRecordingRef.current = true;
      return;
    }
    if (hasRecordedDonation) {
      successRef.current?.focus();
    } else if (wasRecordingRef.current) {
      const opener = openerRef.current;
      if (opener?.isConnected && !(opener instanceof HTMLButtonElement && opener.disabled)) opener.focus();
      else backLinkRef.current?.focus();
    }
    wasRecordingRef.current = false;
  }, [recordingRequest, hasRecordedDonation]);

  function handleRetryRequest() {
    if (requestId) void loadRequestById(requestId);
  }

  function handleRetryDonors() {
    if (requestId && currentRequestId === requestId && requestStatus === 'OPEN') void loadEligibleDonors(requestId);
  }

  function handleRecordDonation(donorId: string) {
    if (!currentRequest || currentRequest.id !== requestId || currentRequest.status !== 'OPEN') return;
    if (recordingRequest || isMutationLoading || isRequestDetailsLoading || isEligibleDonorsLoading || eligibleDonorsError) return;
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    clearMutationError();
    setHasRecordedDonation(false);
    setPreselectedDonorId(donorId);
    setRecordingRequest(currentRequest);
  }

  function handleCloseDonation() {
    if (isMutationLoading) return;
    setRecordingRequest(null);
    clearMutationError();
  }

  function handleDonationSuccess() {
    setRecordingRequest(null);
    setHasRecordedDonation(true);
  }

  function renderDonors() {
    if (!hasLoadedDonors || isEligibleDonorsLoading) return <Loading message="Loading eligible donors..." />;
    if (eligibleDonorsError === 'Blood request not found.') return <EmptyState title="Request not found" description={eligibleDonorsError} />;
    if (eligibleDonorsError) {
      return (
        <div className="eligible-donors-page__error">
          <ErrorMessage message={eligibleDonorsError} onRetry={handleRetryDonors} />
          {eligibleDonorsError === 'Eligible donors can only be matched for OPEN requests.' && (
            <Button type="button" variant="outline" onClick={handleRetryRequest}>Refresh request status</Button>
          )}
        </div>
      );
    }
    if (!eligibleDonorsResult || eligibleDonorsResult.requestId !== requestId) {
      return <EmptyState title="Matching data unavailable" description="Reload the eligible donors for this request." action={<Button type="button" variant="outline" onClick={handleRetryDonors}>Reload eligible donors</Button>} />;
    }

    return (
      <>
        <ExcludedDonorsSummary excludedSummary={eligibleDonorsResult.excludedSummary} />
        <section className="eligible-donors-page__results" aria-labelledby="eligible-donors-results-title">
          <header className="eligible-donors-page__results-header">
            <h2 className="eligible-donors-page__results-title" id="eligible-donors-results-title">Ranked eligible donors for this request ({eligibleDonorsResult.eligibleDonors.length})</h2>
            <p className="eligible-donors-page__privacy">Personal data is hidden from the public.</p>
          </header>
          {eligibleDonorsResult.eligibleDonors.length === 0 ? (
            <div className="eligible-donors-page__empty"><EmptyState title="No eligible donors" description="No eligible donors are currently available in this area. The exclusion counts above explain why compatible donors were excluded." /></div>
          ) : (
            <div className="eligible-donors-page__table-scroll" role="region" aria-label="Ranked eligible donors" tabIndex={0}>
              <table className="eligible-donors-page__table">
                <caption className="eligible-donors-page__caption">Eligible donors in the order returned by the server</caption>
                <thead>
                  <tr>
                    <th className="eligible-donors-page__column" scope="col">Rank</th>
                    <th className="eligible-donors-page__column" scope="col">Donor name / phone</th>
                    <th className="eligible-donors-page__column" scope="col">Blood type / match</th>
                    <th className="eligible-donors-page__column" scope="col">Area</th>
                    <th className="eligible-donors-page__column" scope="col">Last donation</th>
                    <th className="eligible-donors-page__column" scope="col">Pledge on this request</th>
                    <th className="eligible-donors-page__column" scope="col">Quick action</th>
                  </tr>
                </thead>
                <tbody>
                  {eligibleDonorsResult.eligibleDonors.map((donor) => (
                    <EligibleDonorRow key={donor.id} donor={donor} isActionDisabled={isMutationLoading || recordingRequest !== null} onRecordDonation={handleRecordDonation} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </>
    );
  }

  function renderRequest() {
    if (!requestId) return <EmptyState title="Request not found" description="No request ID was provided. Choose a request from the requests list." />;
    if (!hasLoadedRequest || isRequestDetailsLoading) return <Loading message="Loading request details..." />;
    if (requestDetailsError === 'Blood request not found.') return <EmptyState title="Request not found" description={requestDetailsError} />;
    if (requestDetailsError) return <ErrorMessage message={requestDetailsError} onRetry={handleRetryRequest} />;
    if (!currentRequest || currentRequest.id !== requestId) return <EmptyState title="Request details unavailable" action={<Button type="button" variant="outline" onClick={handleRetryRequest}>Reload request details</Button>} />;

    const matchingResult = eligibleDonorsResult?.requestId === requestId && !isEligibleDonorsLoading && !eligibleDonorsError ? eligibleDonorsResult : null;
    return (
      <>
        <section className="eligible-donors-page__summary" aria-label="Request summary">
          <div className="eligible-donors-page__request-heading">
            <h2 className="eligible-donors-page__reference">Request <bdi>{currentRequest.patientReference}</bdi></h2>
            <div className="eligible-donors-page__badges">
              <StatusBadge status={currentRequest.status} />
              <UrgencyBadge urgency={currentRequest.urgency} />
            </div>
          </div>
          <dl className="eligible-donors-page__metadata">
            <div className="eligible-donors-page__detail">
              <dt className="eligible-donors-page__label">Blood type needed</dt>
              <dd className="eligible-donors-page__value">
                <BloodTypeBadge bloodType={matchingResult?.bloodTypeNeeded ?? currentRequest.bloodType} />
              </dd>
            </div>
            <div className="eligible-donors-page__detail">
              <dt className="eligible-donors-page__label">Area</dt>
              <dd className="eligible-donors-page__value">{matchingResult?.area.name ?? currentRequest.area.name}</dd>
            </div>
            <div className="eligible-donors-page__detail">
              <dt className="eligible-donors-page__label">Units still needed</dt>
              <dd className="eligible-donors-page__value eligible-donors-page__value--needed">{formatUnits(currentRequest.unitsStillNeeded)}</dd>
            </div>
            <div className="eligible-donors-page__detail">
              <dt className="eligible-donors-page__label">Active pledges</dt>
              <dd className="eligible-donors-page__value">{currentRequest.activePledgesCount}</dd>
            </div>
          </dl>
        </section>
        {currentRequest.status !== 'OPEN' ? (
          <div className="eligible-donors-page__closed" role="status">
            <EmptyState title="This request is closed" description="Eligible donors can only be matched for OPEN requests. Donation recording is unavailable. Request history remains available in Request Details." />
          </div>
        ) : renderDonors()}
      </>
    );
  }

  return (
    <div className="eligible-donors-page" dir={direction}>
      <PageContainer title="Eligible Donors" subtitle="Find compatible donors in the request's area.">
        <Link className="eligible-donors-page__back" ref={backLinkRef} to={requestId ? `/coordinator/requests/${encodeURIComponent(requestId)}` : '/coordinator/requests'}>
          <span aria-hidden="true">← </span>{requestId ? 'Back to Request Details' : 'Back to Requests List'}
        </Link>
        {hasRecordedDonation && <p className="eligible-donors-page__success" role="status" ref={successRef} tabIndex={-1}>Donation recorded successfully.</p>}
        <div className="eligible-donors-page__content">{renderRequest()}</div>
        {recordingRequest && (
          <div className="eligible-donors-page__donation">
            <RecordDonationModal
              request={currentRequest && currentRequest.id === requestId ? currentRequest : recordingRequest}
              preselectedDonorId={preselectedDonorId}
              onClose={handleCloseDonation}
              onSuccess={handleDonationSuccess}
            />
          </div>
        )}
      </PageContainer>
    </div>
  );
}

export function EligibleDonorsPage() {
  const { requestId } = useParams<{ requestId: string }>();
  // A different route starts a fresh screen and closes the previous request's dialog.
  return <EligibleDonorsContent key={requestId === undefined ? 'missing' : `request:${requestId}`} requestId={requestId} />;
}
