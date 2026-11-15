import { useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, SubmitEvent, SyntheticEvent } from 'react';
import { Button } from '../../components/common/Button';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { useRequests } from '../../context/RequestsContext';
import type { CancelRequestPayload, CoordinatorRequestDetails } from '../../types/request.types';

interface CancelRequestModalProps {
  request: CoordinatorRequestDetails;
  onClose(): void;
  onSuccess(): void;
}

export function CancelRequestModal({ request, onClose, onSuccess }: CancelRequestModalProps) {
  const { cancelRequest, isMutationLoading, mutationError, clearMutationError, isRequestDetailsLoading } = useRequests();
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLParagraphElement>(null);
  const mountedRef = useRef(false);
  const submittingRef = useRef(false);
  const id = useId();
  const isDisabled = isMutationLoading || isRequestDetailsLoading || request.status !== 'OPEN';

  useEffect(() => {
    mountedRef.current = true;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (dialog && !dialog.open) dialog.showModal();
    reasonRef.current?.focus();
    return () => {
      mountedRef.current = false;
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (mutationError) errorRef.current?.focus();
  }, [mutationError]);

  useEffect(() => {
    // Disabled controls cannot keep focus while the cancellation is saving.
    if (isMutationLoading) dialogRef.current?.focus();
  }, [isMutationLoading]);

  useEffect(() => {
    if (request.status !== 'OPEN' && !isMutationLoading) terminalRef.current?.focus();
  }, [request.status, isMutationLoading]);

  function handleReasonChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setReason(event.currentTarget.value);
    setReasonError(null);
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
    if (isDisabled || submittingRef.current) return;
    clearMutationError();
    const cancelReason = reason.trim();
    if (!cancelReason) {
      setReasonError('Cancellation reason is required.');
      reasonRef.current?.focus();
      return;
    }
    setReasonError(null);
    const payload: CancelRequestPayload = { cancelReason };
    submittingRef.current = true;
    try {
      // Context refreshes server data; the component does not release pledges itself.
      const isCancelled = await cancelRequest(request.id, payload);
      if (isCancelled && mountedRef.current) onSuccess();
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <dialog
      className="request-details-cancel__dialog"
      id="request-details-cancel-dialog"
      ref={dialogRef}
      dir="ltr"
      aria-modal="true"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      tabIndex={-1}
      onCancel={handleDialogCancel}
      onKeyDown={handleKeyDown}
    >
      <form className="request-details-cancel" noValidate onSubmit={handleSubmit} aria-busy={isMutationLoading}>
        <header className="request-details-cancel__header">
          <h2 className="request-details-cancel__title" id={`${id}-title`}>Cancel SOS request</h2>
          <Button
            className="request-details-cancel__close"
            type="button"
            variant="secondary"
            size="sm"
            aria-label="Close cancel request dialog"
            disabled={isMutationLoading}
            onClick={handleClose}
          >
            <span aria-hidden="true">×</span>
          </Button>
        </header>
        <p className="request-details-cancel__description" id={`${id}-description`}>
          Cancelling closes request <bdi>{request.patientReference}</bdi> and releases all active pledges. This action cannot be undone.
        </p>

        {request.status !== 'OPEN' && (
          <p className="request-details-cancel__notice" role="status" ref={terminalRef} tabIndex={-1}>
            Only OPEN requests can be cancelled.
          </p>
        )}

        <fieldset className="request-details-cancel__fields" disabled={isDisabled}>
          <legend className="request-details-cancel__legend">Request cancellation</legend>
          <div className="request-details-cancel__field">
            <label className="request-details-cancel__label" htmlFor={`${id}-reason`}>Cancellation reason (required)</label>
            <textarea
              className="request-details-cancel__input"
              id={`${id}-reason`}
              name="cancelReason"
              ref={reasonRef}
              rows={4}
              required
              value={reason}
              placeholder="Example: The required units were supplied by another blood bank..."
              onChange={handleReasonChange}
              aria-invalid={Boolean(reasonError)}
              aria-describedby={reasonError ? `${id}-reason-error` : undefined}
            />
            {reasonError && <p className="request-details-cancel__field-error" id={`${id}-reason-error`} role="alert">{reasonError}</p>}
          </div>
        </fieldset>

        {mutationError && (
          <div className="request-details-cancel__error" ref={errorRef} tabIndex={-1}>
            <ErrorMessage message={mutationError} />
          </div>
        )}
        {isMutationLoading && <p className="request-details-cancel__help" role="status">Cancelling request and refreshing its details...</p>}
        <div className="request-details-cancel__actions">
          <Button className="request-details-cancel__action request-details-cancel__confirm" type="submit" variant="danger" isLoading={isMutationLoading} disabled={isDisabled}>
            {isMutationLoading ? 'Cancelling...' : 'Confirm cancellation'}
          </Button>
          <Button className="request-details-cancel__action" type="button" variant="secondary" disabled={isMutationLoading} onClick={handleClose}>Go back</Button>
        </div>
      </form>
    </dialog>
  );
}
