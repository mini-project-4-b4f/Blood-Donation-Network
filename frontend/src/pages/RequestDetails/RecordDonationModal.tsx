import { useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, SubmitEvent, SyntheticEvent } from 'react';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Loading } from '../../components/common/Loading';
import { useRequests } from '../../context/RequestsContext';
import { useLanguage } from '../../context/LanguageContext';
import type { CoordinatorRequestDetails, RecordDonationPayload } from '../../types/request.types';
import { getTodayString } from '../../utils/date';

interface RecordDonationModalProps {
  request: CoordinatorRequestDetails;
  preselectedDonorId?: string;
  onClose(): void;
  onSuccess(): void;
}

interface FormErrors {
  donorId?: string;
  donationDate?: string;
}

function isRealCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(`${value}T00:00:00Z`);
  return year > 0 && date.getUTCFullYear() === year
    && date.getUTCMonth() + 1 === month && date.getUTCDate() === day;
}

export function RecordDonationModal({ request, preselectedDonorId, onClose, onSuccess }: RecordDonationModalProps) {
  const {
    allDonors, isAllDonorsLoading, allDonorsError, loadAllDonors,
    recordDonation, isMutationLoading, mutationError, clearMutationError, isRequestDetailsLoading,
  } = useRequests();
  const [donorId, setDonorId] = useState(preselectedDonorId ?? '');
  const [donationDate, setDonationDate] = useState(() => getTodayString());
  const [errors, setErrors] = useState<FormErrors>({});
  const [hasLoadedDonors, setHasLoadedDonors] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const donorRef = useRef<HTMLSelectElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLParagraphElement>(null);
  const mountedRef = useRef(false);
  const submittingRef = useRef(false);
  const id = useId();
  const isDisabled = isMutationLoading || isRequestDetailsLoading || request.status !== 'OPEN';
  const isDonorListReady = hasLoadedDonors && !isAllDonorsLoading && !allDonorsError && allDonors.length > 0;
  const hasSelectedDonor = allDonors.some((donor) => donor.id === donorId);

  useEffect(() => {
    mountedRef.current = true;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (dialog && !dialog.open) dialog.showModal();
    dialog?.focus();
    return () => {
      mountedRef.current = false;
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    async function loadDonors() {
      await loadAllDonors();
      if (isActive) setHasLoadedDonors(true);
    }
    void loadDonors();
    return () => { isActive = false; };
  }, [loadAllDonors]);

  useEffect(() => {
    // Do not steal focus if the coordinator already moved to another field while donors loaded.
    if (isDonorListReady && !isMutationLoading && document.activeElement === dialogRef.current) donorRef.current?.focus();
  }, [isDonorListReady, isMutationLoading]);

  useEffect(() => {
    if (mutationError) errorRef.current?.focus();
  }, [mutationError]);

  useEffect(() => {
    if (isMutationLoading) dialogRef.current?.focus();
  }, [isMutationLoading]);

  useEffect(() => {
    if (request.status !== 'OPEN' && !isMutationLoading) terminalRef.current?.focus();
  }, [request.status, isMutationLoading]);

  function handleDonorChange(event: ChangeEvent<HTMLSelectElement>) {
    setDonorId(event.currentTarget.value);
    setErrors((previous) => ({ ...previous, donorId: undefined }));
  }

  function handleDateChange(event: ChangeEvent<HTMLInputElement>) {
    setDonationDate(event.currentTarget.value);
    setErrors((previous) => ({ ...previous, donationDate: undefined }));
  }

  function handleRetryDonors() {
    void loadAllDonors();
  }

  function handleClose() {
    if (!isMutationLoading && !submittingRef.current) onClose();
  }

  function handleDialogCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    handleClose();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return;
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
    )).filter((element) => element.getClientRects().length > 0);
    const first = controls[0];
    const last = controls[controls.length - 1];
    const activeElement = document.activeElement;
    const isControlFocused = activeElement instanceof HTMLElement && controls.includes(activeElement);
    if (!first || !last) {
      event.preventDefault();
      event.currentTarget.focus();
    } else if (event.shiftKey && (activeElement === first || !isControlFocused)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (activeElement === last || !isControlFocused)) {
      event.preventDefault();
      first.focus();
    }
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isDisabled || !isDonorListReady || submittingRef.current) return;
    clearMutationError();
    const nextErrors: FormErrors = {};
    if (!donorId) nextErrors.donorId = t('Donor ID is required.');
    else if (!hasSelectedDonor) nextErrors.donorId = t('Choose a donor from the current list.');
    if (!isRealCalendarDate(donationDate)) nextErrors.donationDate = t('Invalid date. Use the format YYYY-MM-DD.');
    else if (donationDate > getTodayString()) nextErrors.donationDate = t('The donation date cannot be in the future.');
    setErrors(nextErrors);
    if (nextErrors.donorId) {
      donorRef.current?.focus();
      return;
    }
    if (nextErrors.donationDate) {
      dateRef.current?.focus();
      return;
    }

    const payload: RecordDonationPayload = { donorId, donationDate };
    submittingRef.current = true;
    try {
      // Backend decides eligibility and updates pledges, counters and donor data; Context reloads them.
      const isRecorded = await recordDonation(request.id, payload);
      if (isRecorded && mountedRef.current) onSuccess();
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <dialog
      className="request-details-record__dialog"
      id="request-details-record-dialog"
      ref={dialogRef}
      dir={direction}
      aria-modal="true"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      tabIndex={-1}
      onCancel={handleDialogCancel}
      onKeyDown={handleKeyDown}
    >
      <form className="request-details-record" noValidate onSubmit={handleSubmit} aria-busy={isMutationLoading}>
        <header className="request-details-record__header">
          <h2 className="request-details-record__title" id={`${id}-title`}>{t('Record completed donation')}</h2>
          <Button className="request-details-record__close" type="button" variant="secondary" size="sm" aria-label={t("Close record donation dialog")} disabled={isMutationLoading} onClick={handleClose}>
            <span aria-hidden="true">×</span>
          </Button>
        </header>
        <p className="request-details-record__description" id={`${id}-description`}>
          {t('Record one completed unit for request')} <bdi>{request.patientReference}</bdi>. {t('Eligibility is checked when you save.')}
        </p>

        {request.status !== 'OPEN' && (
          <p className="request-details-record__notice" role="status" ref={terminalRef} tabIndex={-1}>{t('Donations can only be recorded for OPEN requests.')}</p>
        )}

        <fieldset className="request-details-record__fields" disabled={isDisabled}>
          <legend className="request-details-record__legend">{t('Completed donation information')}</legend>
          <div className="request-details-record__field">
            <label className="request-details-record__label" htmlFor={`${id}-donor`}>{t('Donor')}</label>
            <select
              className="request-details-record__input"
              id={`${id}-donor`}
              name="donorId"
              ref={donorRef}
              required
              value={donorId}
              disabled={!isDonorListReady}
              onChange={handleDonorChange}
              aria-invalid={Boolean(errors.donorId)}
              aria-describedby={errors.donorId ? `${id}-donor-error` : undefined}
            >
              <option value="">{t('Choose a donor...')}</option>
              {donorId && !hasSelectedDonor && <option value={donorId}>{t('Selected donor (not in current list)')}</option>}
              {allDonors.map((donor) => <option key={donor.id} value={donor.id}>{donor.fullName} ({donor.bloodType} - {donor.area.name})</option>)}
            </select>
            {errors.donorId && <p className="request-details-record__field-error" id={`${id}-donor-error`} role="alert">{errors.donorId}</p>}
          </div>

          {(!hasLoadedDonors || isAllDonorsLoading) && <Loading message="Loading donors..." />}
          {hasLoadedDonors && !isAllDonorsLoading && allDonorsError && <ErrorMessage message={allDonorsError} onRetry={handleRetryDonors} />}
          {hasLoadedDonors && !isAllDonorsLoading && !allDonorsError && allDonors.length === 0 && (
            <EmptyState title={t("No donors available")} description={t("No donor profiles are available to select.")} action={<Button type="button" variant="outline" onClick={handleRetryDonors}>{t('Reload donors')}</Button>} />
          )}

          <div className="request-details-record__field">
            <label className="request-details-record__label" htmlFor={`${id}-date`}>{t('Donation date')}</label>
            <input
              className="request-details-record__input"
              id={`${id}-date`}
              name="donationDate"
              ref={dateRef}
              type="date"
              required
              max={getTodayString()}
              value={donationDate}
              onChange={handleDateChange}
              aria-invalid={Boolean(errors.donationDate)}
              aria-describedby={errors.donationDate ? `${id}-date-error` : undefined}
            />
            {errors.donationDate && <p className="request-details-record__field-error" id={`${id}-date-error`} role="alert">{errors.donationDate}</p>}
          </div>
        </fieldset>

        {mutationError && <div className="request-details-record__error" ref={errorRef} tabIndex={-1}><ErrorMessage message={mutationError} /></div>}
        {isMutationLoading && <p className="request-details-record__help" role="status">{t('Saving donation and refreshing request data...')}</p>}
        <div className="request-details-record__actions">
          <Button className="request-details-record__action request-details-record__save" type="submit" variant="primary" isLoading={isMutationLoading} disabled={isDisabled || !isDonorListReady}>
            {isMutationLoading ? 'Saving...' : 'Save donation'}
          </Button>
          <Button className="request-details-record__action" type="button" variant="secondary" disabled={isMutationLoading} onClick={handleClose}>{t('Go back')}</Button>
        </div>
      </form>
    </dialog>
  );
}
