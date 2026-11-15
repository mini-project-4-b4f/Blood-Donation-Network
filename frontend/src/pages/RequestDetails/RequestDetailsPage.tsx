import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
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
import type { CoordinatorRequestDetails, RequestDonationItem, RequestPledgeItem } from '../../types/request.types';
import { formatDate, formatDateTime, formatPhone, formatUnits } from '../../utils/format';
import { UpdateRequestForm } from './UpdateRequestForm';
import { CancelRequestModal } from './CancelRequestModal';
import { RecordDonationModal } from './RecordDonationModal';
import './RequestDetailsPage.css';

interface RequestPledgesListProps {
  pledges: readonly RequestPledgeItem[];
  canRecordDonation: boolean;
  isActionDisabled: boolean;
  onRecordDonation(donorId: string): void;
}

function RequestPledgesList({ pledges, canRecordDonation, isActionDisabled, onRecordDonation }: RequestPledgesListProps) {
  function handleRecordDonation(event: MouseEvent<HTMLButtonElement>) {
    const donorId = event.currentTarget.dataset.donorId;
    if (donorId) onRecordDonation(donorId);
  }

  if (pledges.length === 0) {
    return <EmptyState title="No pledges yet" description="Pledges for this request will appear here." />;
  }

  return (
    <ul className="request-details-history__list">
      {pledges.map((pledge) => (
        <li className="request-details-history__item" key={pledge.id}>
          <div className="request-details-history__row">
            <div className="request-details-history__donor">
              <h3 className="request-details-history__name">{pledge.donor.fullName}</h3>
              <BloodTypeBadge bloodType={pledge.donor.bloodType} />
            </div>
            <StatusBadge status={pledge.status} />
          </div>
          <dl className="request-details-history__metadata">
            <div className="request-details-history__detail">
              <dt className="request-details-history__label">Phone</dt>
              <dd className="request-details-history__value"><bdi>{formatPhone(pledge.donor.phone)}</bdi></dd>
            </div>
            <div className="request-details-history__detail">
              <dt className="request-details-history__label">Area</dt>
              <dd className="request-details-history__value">{pledge.donor.area.name}</dd>
            </div>
            <div className="request-details-history__detail">
              <dt className="request-details-history__label">Pledged at</dt>
              <dd className="request-details-history__value">
                <time dateTime={pledge.createdAt}>{formatDateTime(pledge.createdAt)}</time>
              </dd>
            </div>
          </dl>
          {canRecordDonation && pledge.status === 'PLEDGED' && (
            <Button
              className="request-details-record__pledge-action"
              type="button"
              variant="outline"
              data-donor-id={pledge.donor.id}
              aria-label={`Record donation for ${pledge.donor.fullName}`}
              aria-haspopup="dialog"
              disabled={isActionDisabled}
              onClick={handleRecordDonation}
            >
              Record donation
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}

interface RequestDonationsListProps {
  donations: readonly RequestDonationItem[];
}

function RequestDonationsList({ donations }: RequestDonationsListProps) {
  if (donations.length === 0) {
    return <EmptyState title="No donations recorded" description="Completed donations for this request will appear here." />;
  }

  return (
    <ul className="request-details-history__list">
      {donations.map((donation) => (
        <li className="request-details-history__item request-details-history__item--donation" key={donation.id}>
          <div className="request-details-history__row">
            <div className="request-details-history__donor">
              <h3 className="request-details-history__name">{donation.donor.fullName}</h3>
              <BloodTypeBadge bloodType={donation.donor.bloodType} />
            </div>
            <span className="request-details-history__units">{formatUnits(donation.units)} recorded</span>
          </div>
          <dl className="request-details-history__metadata">
            <div className="request-details-history__detail">
              <dt className="request-details-history__label">Donor phone</dt>
              <dd className="request-details-history__value"><bdi>{formatPhone(donation.donor.phone)}</bdi></dd>
            </div>
            <div className="request-details-history__detail">
              <dt className="request-details-history__label">Donation date</dt>
              <dd className="request-details-history__value">
                <time dateTime={donation.donationDate}>{formatDate(donation.donationDate)}</time>
              </dd>
            </div>
            <div className="request-details-history__detail">
              <dt className="request-details-history__label">Recorded at</dt>
              <dd className="request-details-history__value">
                <time dateTime={donation.createdAt}>{formatDateTime(donation.createdAt)}</time>
              </dd>
            </div>
            <div className="request-details-history__detail">
              <dt className="request-details-history__label">Recorded by coordinator</dt>
              <dd className="request-details-history__value"><bdi>{formatPhone(donation.recordedBy.phone)}</bdi></dd>
            </div>
            {donation.recordedBy.email && (
              <div className="request-details-history__detail">
                <dt className="request-details-history__label">Coordinator email</dt>
                <dd className="request-details-history__value"><bdi>{donation.recordedBy.email}</bdi></dd>
              </div>
            )}
          </dl>
        </li>
      ))}
    </ul>
  );
}

export function RequestDetailsPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const { currentRequest, isRequestDetailsLoading, requestDetailsError, loadRequestById, isMutationLoading, clearMutationError } = useRequests();
  const [loadedRequestId, setLoadedRequestId] = useState<string | null>(null);
  const [editingRequest, setEditingRequest] = useState<CoordinatorRequestDetails | null>(null);
  const [updatedRequestId, setUpdatedRequestId] = useState<string | null>(null);
  const [cancellingRequest, setCancellingRequest] = useState<CoordinatorRequestDetails | null>(null);
  const [cancelledRequestId, setCancelledRequestId] = useState<string | null>(null);
  const [recordingRequest, setRecordingRequest] = useState<CoordinatorRequestDetails | null>(null);
  const [preselectedDonorId, setPreselectedDonorId] = useState<string | undefined>(undefined);
  const [recordedRequestId, setRecordedRequestId] = useState<string | null>(null);
  const successRef = useRef<HTMLParagraphElement>(null);
  const cancelSuccessRef = useRef<HTMLParagraphElement>(null);
  const recordSuccessRef = useRef<HTMLParagraphElement>(null);
  const recordOpenerRef = useRef<HTMLElement | null>(null);
  const backLinkRef = useRef<HTMLAnchorElement>(null);
  const wasEditingRef = useRef(false);
  const wasCancellingRef = useRef(false);
  const wasRecordingRef = useRef(false);

  useEffect(() => {
    let isActive = true;

    async function loadDetails() {
      if (!requestId) return;
      await loadRequestById(requestId);
      if (isActive) {
        setLoadedRequestId(requestId);
        setEditingRequest(null);
        setUpdatedRequestId(null);
        setCancellingRequest(null);
        setCancelledRequestId(null);
        setRecordingRequest(null);
        setRecordedRequestId(null);
      }
    }

    void loadDetails();
    return () => { isActive = false; };
  }, [requestId, loadRequestById]);

  useEffect(() => {
    if (editingRequest) {
      wasEditingRef.current = true;
      return;
    }
    if (updatedRequestId && updatedRequestId === requestId) {
      successRef.current?.focus();
    } else if (wasEditingRef.current) {
      // Wait for React to re-enable the opener, or use Back if the request is now closed.
      const opener = document.getElementById('request-details-update-action');
      (opener ?? backLinkRef.current)?.focus();
    }
    wasEditingRef.current = false;
  }, [editingRequest, updatedRequestId, requestId]);

  useEffect(() => {
    if (cancellingRequest) {
      wasCancellingRef.current = true;
      return;
    }
    if (cancelledRequestId && cancelledRequestId === requestId) {
      cancelSuccessRef.current?.focus();
    } else if (wasCancellingRef.current) {
      const opener = document.getElementById('request-details-cancel-action');
      (opener ?? backLinkRef.current)?.focus();
    }
    wasCancellingRef.current = false;
  }, [cancellingRequest, cancelledRequestId, requestId]);

  useEffect(() => {
    if (recordingRequest) {
      wasRecordingRef.current = true;
      return;
    }
    if (recordedRequestId && recordedRequestId === requestId) {
      recordSuccessRef.current?.focus();
    } else if (wasRecordingRef.current) {
      // The opener can be the main action or a PLEDGED row; it may disappear after a refresh.
      const opener = recordOpenerRef.current;
      if (opener?.isConnected && !(opener instanceof HTMLButtonElement && opener.disabled)) opener.focus();
      else backLinkRef.current?.focus();
    }
    wasRecordingRef.current = false;
  }, [recordingRequest, recordedRequestId, requestId]);

  function handleRetry() {
    if (requestId) void loadRequestById(requestId);
  }

  function handleOpenUpdate() {
    if (editingRequest || cancellingRequest || recordingRequest) return;
    if (!currentRequest || currentRequest.id !== requestId || currentRequest.status !== 'OPEN' || isMutationLoading || isRequestDetailsLoading) return;
    clearMutationError();
    setUpdatedRequestId(null);
    setCancelledRequestId(null);
    setRecordedRequestId(null);
    setEditingRequest(currentRequest);
  }

  function handleCancelUpdate() {
    if (isMutationLoading) return;
    setEditingRequest(null);
    clearMutationError();
  }

  function handleUpdateSuccess() {
    setEditingRequest(null);
    setUpdatedRequestId(requestId ?? null);
  }

  function handleOpenCancel() {
    if (editingRequest || cancellingRequest || recordingRequest || !currentRequest || currentRequest.id !== requestId || currentRequest.status !== 'OPEN' || isMutationLoading || isRequestDetailsLoading) return;
    clearMutationError();
    setUpdatedRequestId(null);
    setCancelledRequestId(null);
    setRecordedRequestId(null);
    setCancellingRequest(currentRequest);
  }

  function handleCloseCancel() {
    if (isMutationLoading) return;
    setCancellingRequest(null);
    clearMutationError();
  }

  function handleCancelSuccess() {
    setCancellingRequest(null);
    setCancelledRequestId(requestId ?? null);
  }

  function openRecordDonation(donorId?: string) {
    if (editingRequest || cancellingRequest || recordingRequest || !currentRequest || currentRequest.id !== requestId || currentRequest.status !== 'OPEN' || isMutationLoading || isRequestDetailsLoading) return;
    recordOpenerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    clearMutationError();
    setUpdatedRequestId(null);
    setCancelledRequestId(null);
    setRecordedRequestId(null);
    setPreselectedDonorId(donorId);
    setRecordingRequest(currentRequest);
  }

  function handleOpenRecordDonation() {
    openRecordDonation();
  }

  function handleRecordDonationForDonor(donorId: string) {
    openRecordDonation(donorId);
  }

  function handleCloseRecordDonation() {
    if (isMutationLoading) return;
    setRecordingRequest(null);
    clearMutationError();
  }

  function handleRecordDonationSuccess() {
    setRecordingRequest(null);
    setRecordedRequestId(requestId ?? null);
  }

  function renderRequestDetails() {
    if (!requestId) {
      return <EmptyState title="Request not found" description="No request ID was provided. Choose a request from the requests list." />;
    }
    if (loadedRequestId !== requestId || isRequestDetailsLoading) {
      return <Loading message="Loading request details..." />;
    }
    if (requestDetailsError === 'Blood request not found.') {
      return <EmptyState title="Request not found" description={requestDetailsError} />;
    }
    if (requestDetailsError) {
      return <ErrorMessage message={requestDetailsError} onRetry={handleRetry} />;
    }
    if (!currentRequest || currentRequest.id !== requestId) {
      return (
        <EmptyState
          title="No request details available"
          description="Try loading the request again or return to the requests list."
          action={<Button type="button" variant="outline" onClick={handleRetry}>Retry</Button>}
        />
      );
    }

    const request = currentRequest;

    return (
      <div className="request-details-page__content">
        {request.status !== 'OPEN' && (
          <p className="request-details-page__terminal" role="status">
            This request is {request.status === 'FULFILLED' ? 'fulfilled' : 'cancelled'} and read-only.
            {' '}It cannot be updated or reopened, and no further pledges, donor matching or donations are allowed.
          </p>
        )}

        <section className="request-details-page__summary" aria-labelledby="request-details-hospital">
          <div className="request-details-page__header">
            <div className="request-details-page__blood"><BloodTypeBadge bloodType={request.bloodType} /></div>
            <div className="request-details-page__identity">
              <div className="request-details-page__reference-row">
                <p className="request-details-page__reference">Reference: <bdi>{request.patientReference}</bdi></p>
                <UrgencyBadge urgency={request.urgency} />
              </div>
              <h2 className="request-details-page__hospital" id="request-details-hospital">{request.hospital}</h2>
            </div>
            <StatusBadge status={request.status} />
          </div>

          <dl className="request-details-page__metadata">
            <div className="request-details-page__detail">
              <dt className="request-details-page__label">Area</dt>
              <dd className="request-details-page__value">{request.area.name}</dd>
            </div>
            <div className="request-details-page__detail">
              <dt className="request-details-page__label">Created</dt>
              <dd className="request-details-page__value"><time dateTime={request.createdAt}>{formatDateTime(request.createdAt)}</time></dd>
            </div>
            <div className="request-details-page__detail">
              <dt className="request-details-page__label">Last updated</dt>
              <dd className="request-details-page__value"><time dateTime={request.updatedAt}>{formatDateTime(request.updatedAt)}</time></dd>
            </div>
            <div className="request-details-page__detail">
              <dt className="request-details-page__label">Request ID</dt>
              <dd className="request-details-page__value"><bdi>{request.id}</bdi></dd>
            </div>
          </dl>

          <div className="request-details-page__note">
            <h3 className="request-details-page__note-title">Coordinator notes</h3>
            <p className="request-details-page__note-text">{request.note || 'No notes provided.'}</p>
          </div>
          {request.status === 'CANCELLED' && (
            <div className="request-details-page__note request-details-page__note--cancelled">
              <h3 className="request-details-page__note-title">Cancellation reason</h3>
              <p className="request-details-page__note-text">{request.cancelReason || 'No cancellation reason provided.'}</p>
            </div>
          )}

          <dl className="request-details-page__counters">
            <div className="request-details-page__counter">
              <dt className="request-details-page__counter-label">Units required</dt>
              <dd className="request-details-page__counter-value">{request.unitsRequired}</dd>
            </div>
            <div className="request-details-page__counter request-details-page__counter--collected">
              <dt className="request-details-page__counter-label">Units collected</dt>
              <dd className="request-details-page__counter-value">{request.unitsCollected}</dd>
            </div>
            <div className="request-details-page__counter request-details-page__counter--needed">
              <dt className="request-details-page__counter-label">Units still needed</dt>
              <dd className="request-details-page__counter-value">{request.unitsStillNeeded}</dd>
            </div>
          </dl>
          <p className="request-details-page__pledge-count">Active pledges: <strong>{request.activePledgesCount}</strong></p>
        </section>

        <div className="request-details-page__history">
          <section className="request-details-history" aria-labelledby="request-details-pledges">
            <h2 className="request-details-history__title" id="request-details-pledges">Pledges on this request ({request.pledges.length})</h2>
            <RequestPledgesList
              pledges={request.pledges}
              canRecordDonation={request.status === 'OPEN'}
              isActionDisabled={isMutationLoading || Boolean(editingRequest || cancellingRequest || recordingRequest)}
              onRecordDonation={handleRecordDonationForDonor}
            />
          </section>
          <section className="request-details-history" aria-labelledby="request-details-donations">
            <h2 className="request-details-history__title" id="request-details-donations">Recorded donations ({request.donations.length})</h2>
            <RequestDonationsList donations={request.donations} />
          </section>
        </div>
      </div>
    );
  }

  const canShowEligibleDonors = Boolean(
    requestId && loadedRequestId === requestId && !isRequestDetailsLoading && !requestDetailsError
    && currentRequest?.id === requestId && currentRequest.status === 'OPEN',
  );

  return (
    <div className="request-details-page" dir="ltr">
      <nav className="request-details-page__navigation" aria-label="Request navigation">
        <Link className="request-details-page__link" ref={backLinkRef} to="/coordinator/requests">Back to requests</Link>
        <div className="request-details-page__actions">
          {canShowEligibleDonors && requestId && (
            <Link
              className="request-details-page__link request-details-page__link--primary"
              to={`/coordinator/requests/${encodeURIComponent(requestId)}/eligible-donors`}
            >
              Find eligible donors
            </Link>
          )}
          {canShowEligibleDonors && (
            <Button
              type="button"
              variant="outline"
              id="request-details-update-action"
              aria-expanded={editingRequest?.id === requestId}
              aria-haspopup="dialog"
              aria-controls={editingRequest?.id === requestId ? 'request-details-update-dialog' : undefined}
              disabled={isMutationLoading || editingRequest?.id === requestId || cancellingRequest?.id === requestId || recordingRequest?.id === requestId}
              onClick={handleOpenUpdate}
            >
              Update request
            </Button>
          )}
          {canShowEligibleDonors && (
            <Button
              className="request-details-cancel__trigger"
              type="button"
              variant="outline"
              id="request-details-cancel-action"
              aria-expanded={cancellingRequest?.id === requestId}
              aria-haspopup="dialog"
              aria-controls={cancellingRequest?.id === requestId ? 'request-details-cancel-dialog' : undefined}
              disabled={isMutationLoading || editingRequest?.id === requestId || cancellingRequest?.id === requestId || recordingRequest?.id === requestId}
              onClick={handleOpenCancel}
            >
              Cancel request
            </Button>
          )}
          {canShowEligibleDonors && (
            <Button
              className="request-details-record__trigger"
              type="button"
              variant="primary"
              id="request-details-record-action"
              aria-expanded={recordingRequest?.id === requestId}
              aria-haspopup="dialog"
              aria-controls={recordingRequest?.id === requestId ? 'request-details-record-dialog' : undefined}
              disabled={isMutationLoading || Boolean(editingRequest || cancellingRequest || recordingRequest)}
              onClick={handleOpenRecordDonation}
            >
              Record donation
            </Button>
          )}
        </div>
      </nav>
      <PageContainer title="Request details" subtitle="Blood request information, pledges and donation history.">
        {updatedRequestId && updatedRequestId === requestId && (
          <p className="request-details-page__success" role="status" ref={successRef} tabIndex={-1}>Request updated successfully.</p>
        )}
        {cancelledRequestId && cancelledRequestId === requestId && (
          <p className="request-details-page__success" role="status" ref={cancelSuccessRef} tabIndex={-1}>Request cancelled successfully.</p>
        )}
        {recordedRequestId && recordedRequestId === requestId && (
          <p className="request-details-page__success" role="status" ref={recordSuccessRef} tabIndex={-1}>Donation recorded successfully.</p>
        )}
        {/* Keep the modal mounted during Context refreshes so its draft and completion handler survive. */}
        {editingRequest && editingRequest.id === requestId && (
          <UpdateRequestForm
            key={editingRequest.id}
            request={currentRequest?.id === editingRequest.id ? currentRequest : editingRequest}
            onCancel={handleCancelUpdate}
            onSuccess={handleUpdateSuccess}
          />
        )}
        {cancellingRequest && cancellingRequest.id === requestId && (
          <CancelRequestModal
            key={cancellingRequest.id}
            request={currentRequest?.id === cancellingRequest.id ? currentRequest : cancellingRequest}
            onClose={handleCloseCancel}
            onSuccess={handleCancelSuccess}
          />
        )}
        {recordingRequest && recordingRequest.id === requestId && (
          <RecordDonationModal
            key={recordingRequest.id}
            request={currentRequest?.id === recordingRequest.id ? currentRequest : recordingRequest}
            preselectedDonorId={preselectedDonorId}
            onClose={handleCloseRecordDonation}
            onSuccess={handleRecordDonationSuccess}
          />
        )}
        <div className="request-details-page__results" aria-busy={isRequestDetailsLoading}>
          {renderRequestDetails()}
        </div>
      </PageContainer>
    </div>
  );
}

export default RequestDetailsPage;
