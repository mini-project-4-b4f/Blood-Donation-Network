import { useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, SubmitEvent, SyntheticEvent } from 'react';
import { Button } from '../../components/common/Button';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { MAX_UNITS, MIN_UNITS, URGENCY_LEVELS } from '../../constants';
import { useRequests } from '../../context/RequestsContext';
import type { CoordinatorRequestDetails, UpdateRequestPayload, Urgency } from '../../types/request.types';

interface UpdateRequestFormProps {
  request: CoordinatorRequestDetails;
  onCancel(): void;
  onSuccess(): void;
}

interface FormErrors {
  unitsRequired?: string;
  urgency?: string;
}

const urgencyLevels: readonly Urgency[] = URGENCY_LEVELS;

export function UpdateRequestForm({ request, onCancel, onSuccess }: UpdateRequestFormProps) {
  const { updateRequest, isMutationLoading, mutationError, clearMutationError, isRequestDetailsLoading } = useRequests();
  const [unitsInput, setUnitsInput] = useState(String(request.unitsRequired));
  const [urgency, setUrgency] = useState<Urgency | ''>(request.urgency);
  const [note, setNote] = useState(request.note ?? '');
  const [errors, setErrors] = useState<FormErrors>({});
  const dialogRef = useRef<HTMLDialogElement>(null);
  const unitsRef = useRef<HTMLInputElement>(null);
  const urgencyRef = useRef<HTMLSelectElement>(null);
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
    unitsRef.current?.focus();
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
    // Disabled controls cannot retain focus; keep keyboard events inside the modal while saving.
    if (isMutationLoading) dialogRef.current?.focus();
  }, [isMutationLoading]);

  useEffect(() => {
    if (request.status !== 'OPEN' && !isMutationLoading) terminalRef.current?.focus();
  }, [request.status, isMutationLoading]);

  function handleUnitsChange(event: ChangeEvent<HTMLInputElement>) {
    setUnitsInput(event.currentTarget.value);
    setErrors((previous) => ({ ...previous, unitsRequired: undefined }));
  }

  function handleUrgencyChange(event: ChangeEvent<HTMLSelectElement>) {
    setUrgency(urgencyLevels.find((value) => value === event.currentTarget.value) ?? '');
    setErrors((previous) => ({ ...previous, urgency: undefined }));
  }

  function handleNoteChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setNote(event.currentTarget.value);
  }

  function handleCancel() {
    if (!isMutationLoading && !submittingRef.current) onCancel();
  }

  function handleDialogCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    handleCancel();
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

    const unitsRequired = Number(unitsInput);
    const selectedUrgency = urgencyLevels.find((value) => value === urgency);
    const nextErrors: FormErrors = {};
    if (!Number.isInteger(unitsRequired) || unitsRequired < MIN_UNITS || unitsRequired > MAX_UNITS) {
      nextErrors.unitsRequired = `Units required must be a whole number between ${MIN_UNITS} and ${MAX_UNITS}.`;
    } else if (unitsRequired < request.unitsCollected) {
      nextErrors.unitsRequired = 'Units required cannot be reduced below the units already collected.';
    }
    if (!selectedUrgency) nextErrors.urgency = 'Urgency must be CRITICAL, HIGH, or NORMAL.';
    setErrors(nextErrors);
    if (nextErrors.unitsRequired) {
      unitsRef.current?.focus();
      return;
    }
    if (!selectedUrgency) {
      urgencyRef.current?.focus();
      return;
    }

    // Send an empty note explicitly when the coordinator clears it; omission would keep it unchanged.
    const payload: UpdateRequestPayload = { unitsRequired, urgency: selectedUrgency, note };
    submittingRef.current = true;
    try {
      // Context preserves backend errors and refreshes affected data before returning success.
      const isUpdated = await updateRequest(request.id, payload);
      if (isUpdated && mountedRef.current) onSuccess();
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <dialog
      className="request-details-update__dialog"
      id="request-details-update-dialog"
      ref={dialogRef}
      dir="ltr"
      aria-modal="true"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      tabIndex={-1}
      onCancel={handleDialogCancel}
      onKeyDown={handleKeyDown}
    >
      <form
        className="request-details-update"
        id="request-details-update-form"
        dir="ltr"
        noValidate
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
        aria-busy={isMutationLoading}
        onSubmit={handleSubmit}
      >
        <header className="request-details-update__header">
          <h2 className="request-details-update__title" id={`${id}-title`}>Update request</h2>
          <Button
            className="request-details-update__close"
            type="button"
            variant="secondary"
            size="sm"
            aria-label="Close update request dialog"
            disabled={isMutationLoading}
            onClick={handleCancel}
          >
            <span aria-hidden="true">×</span>
          </Button>
        </header>
        <p className="request-details-update__description" id={`${id}-description`}>
          Edit units required, urgency and coordinator notes for <bdi>{request.patientReference}</bdi>.
        </p>

        {request.status !== 'OPEN' && (
          <p className="request-details-update__notice" role="status" ref={terminalRef} tabIndex={-1}>
            Only OPEN requests can be updated.
          </p>
        )}

        <fieldset className="request-details-update__fields" disabled={isDisabled}>
          <legend className="request-details-update__legend">Editable request information</legend>
          <div className="request-details-update__pair">
            <div className="request-details-update__field">
              <label className="request-details-update__label" htmlFor={`${id}-units`}>Units required</label>
              <input
                className="request-details-update__input"
                id={`${id}-units`}
                name="unitsRequired"
                ref={unitsRef}
                type="number"
                min={MIN_UNITS}
                max={MAX_UNITS}
                step={1}
                required
                value={unitsInput}
                onChange={handleUnitsChange}
                aria-invalid={Boolean(errors.unitsRequired)}
                aria-describedby={`${id}-units-help${errors.unitsRequired ? ` ${id}-units-error` : ''}`}
              />
              <p className="request-details-update__help" id={`${id}-units-help`}>
                Whole numbers from {MIN_UNITS} to {MAX_UNITS}. Units already collected: {request.unitsCollected}.
              </p>
              {errors.unitsRequired && <p className="request-details-update__field-error" id={`${id}-units-error`} role="alert">{errors.unitsRequired}</p>}
            </div>

            <div className="request-details-update__field">
              <label className="request-details-update__label" htmlFor={`${id}-urgency`}>Urgency</label>
              <select
                className="request-details-update__input"
                id={`${id}-urgency`}
                name="urgency"
                ref={urgencyRef}
                required
                value={urgency}
                onChange={handleUrgencyChange}
                aria-invalid={Boolean(errors.urgency)}
                aria-describedby={errors.urgency ? `${id}-urgency-error` : undefined}
              >
                {urgencyLevels.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
              {errors.urgency && <p className="request-details-update__field-error" id={`${id}-urgency-error`} role="alert">{errors.urgency}</p>}
            </div>
          </div>

          <div className="request-details-update__field">
            <label className="request-details-update__label" htmlFor={`${id}-note`}>Note (optional)</label>
            <textarea
              className="request-details-update__input request-details-update__input--note"
              id={`${id}-note`}
              name="note"
              rows={3}
              value={note}
              onChange={handleNoteChange}
            />
          </div>
        </fieldset>

        {mutationError && (
          <div className="request-details-update__error" ref={errorRef} tabIndex={-1}>
            <ErrorMessage message={mutationError} />
          </div>
        )}
        {isMutationLoading && <p className="request-details-update__help" role="status">Saving request and refreshing its details...</p>}
        <div className="request-details-update__actions">
          <Button className="request-details-update__action" type="button" variant="outline" disabled={isMutationLoading} onClick={handleCancel}>
            {request.status === 'OPEN' ? 'Discard changes' : 'Close'}
          </Button>
          <Button className="request-details-update__action" type="submit" variant="primary" isLoading={isMutationLoading} disabled={isDisabled}>
            {isMutationLoading ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
