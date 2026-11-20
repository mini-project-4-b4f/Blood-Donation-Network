import { useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, SubmitEvent, SyntheticEvent } from 'react';
import { Button } from '../../components/common/Button';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { BLOOD_TYPES, MAX_UNITS, MIN_UNITS, URGENCY_LEVELS } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { useRequests } from '../../context/RequestsContext';
import { useLanguage } from '../../context/LanguageContext';
import type { Area, BloodType } from '../../types/auth.types';
import type { CoordinatorRequestDetails, CreateRequestPayload, Urgency } from '../../types/request.types';

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose(): void;
  onSuccess(request: CoordinatorRequestDetails): void;
}

interface FormErrors {
  patientReference?: string;
  bloodType?: string;
  unitsRequired?: string;
  areaId?: string;
  urgency?: string;
  hospital?: string;
}

const bloodTypes: readonly BloodType[] = BLOOD_TYPES;
const urgencyLevels: readonly Urgency[] = URGENCY_LEVELS;

export function CreateRequestModal({ isOpen, onClose, onSuccess }: CreateRequestModalProps) {
  const { t, direction } = useLanguage();
  const { createRequest, isMutationLoading, mutationError, clearMutationError } = useRequests();
  const { areas, isAreasLoading, authError, loadAreas } = useAuth();
  const [patientReference, setPatientReference] = useState('');
  const [bloodType, setBloodType] = useState<BloodType | ''>('');
  const [unitsInput, setUnitsInput] = useState(String(MIN_UNITS));
  const [areaId, setAreaId] = useState('');
  const [urgency, setUrgency] = useState<Urgency | ''>('');
  const [hospital, setHospital] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const patientReferenceRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false);
  const mountedRef = useRef(false);
  const id = useId();
  const fieldId = (field: string) => `requests-create-${id}-${field}`;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (!dialog.open) dialog.showModal();
    patientReferenceRef.current?.focus();

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && mutationError) errorRef.current?.focus();
  }, [isOpen, mutationError]);

  function handlePatientReferenceChange(event: ChangeEvent<HTMLInputElement>) {
    setPatientReference(event.currentTarget.value);
    setErrors((previous) => ({ ...previous, patientReference: undefined }));
  }

  function handleBloodTypeChange(event: ChangeEvent<HTMLSelectElement>) {
    setBloodType(bloodTypes.find((value) => value === event.currentTarget.value) ?? '');
    setErrors((previous) => ({ ...previous, bloodType: undefined }));
  }

  function handleUnitsChange(event: ChangeEvent<HTMLInputElement>) {
    setUnitsInput(event.currentTarget.value);
    setErrors((previous) => ({ ...previous, unitsRequired: undefined }));
  }

  function handleAreaChange(event: ChangeEvent<HTMLSelectElement>) {
    setAreaId(event.currentTarget.value);
    setErrors((previous) => ({ ...previous, areaId: undefined }));
  }

  function handleUrgencyChange(event: ChangeEvent<HTMLSelectElement>) {
    setUrgency(urgencyLevels.find((value) => value === event.currentTarget.value) ?? '');
    setErrors((previous) => ({ ...previous, urgency: undefined }));
  }

  function handleHospitalChange(event: ChangeEvent<HTMLInputElement>) {
    setHospital(event.currentTarget.value);
    setErrors((previous) => ({ ...previous, hospital: undefined }));
  }

  function handleNoteChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setNote(event.currentTarget.value);
  }

  function resetForm() {
    setPatientReference('');
    setBloodType('');
    setUnitsInput(String(MIN_UNITS));
    setAreaId('');
    setUrgency('');
    setHospital('');
    setNote('');
    setErrors({});
  }

  function handleRetryAreas() {
    void loadAreas();
  }

  function handleClose() {
    if (!isMutationLoading && !submittingRef.current) onClose();
  }

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
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
    if (isMutationLoading || submittingRef.current || isAreasLoading || areas.length === 0) return;
    clearMutationError();

    const selectedBloodType = bloodTypes.find((value) => value === bloodType);
    const selectedUrgency = urgencyLevels.find((value) => value === urgency);
    const unitsRequired = Number(unitsInput);
    const nextErrors: FormErrors = {};
    if (!patientReference.trim()) nextErrors.patientReference = t('Patient reference is required.');
    if (!selectedBloodType) nextErrors.bloodType = t('Select a blood type.');
    if (!Number.isInteger(unitsRequired) || unitsRequired < MIN_UNITS || unitsRequired > MAX_UNITS) {
      nextErrors.unitsRequired = `${t('Units required')} ${t('must be a whole number between')} ${MIN_UNITS} ${t('and')} ${MAX_UNITS}.`;
    }
    if (!areaId) nextErrors.areaId = t('Area is required.');
    if (!selectedUrgency) nextErrors.urgency = t('Select an urgency level.');
    if (!hospital.trim()) nextErrors.hospital = t('Hospital or blood-bank name is required.');
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0 || !selectedBloodType || !selectedUrgency) {
      const firstInvalidField = Object.keys(nextErrors)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalidField}"]`)?.focus();
      return;
    }

    const payload: CreateRequestPayload = {
      patientReference: patientReference.trim(),
      bloodType: selectedBloodType,
      unitsRequired,
      areaId,
      urgency: selectedUrgency,
      hospital: hospital.trim(),
    };
    const trimmedNote = note.trim();
    if (trimmedNote) payload.note = trimmedNote;

    submittingRef.current = true;
    try {
      const created = await createRequest(payload);
      if (created && mountedRef.current) {
        resetForm();
        onSuccess(created);
        onClose();
      }
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <dialog
      className="requests-create__dialog"
      ref={dialogRef}
      dir={direction}
      aria-modal="true"
      aria-labelledby={fieldId('title')}
      aria-describedby={fieldId('description')}
      tabIndex={-1}
      onCancel={handleCancel}
      onKeyDown={handleKeyDown}
    >
      <header className="requests-create__header">
        <h2 className="requests-create__title" id={fieldId('title')}>{t('Create SOS request')}</h2>
        <Button
          className="requests-create__close"
          type="button"
          variant="secondary"
          size="sm"
          aria-label={t("Close create request dialog")}
          disabled={isMutationLoading}
          onClick={handleClose}
        >
          <span aria-hidden="true">×</span>
        </Button>
      </header>
      <p className="requests-create__description" id={fieldId('description')}>{t('Publish a blood request for your hospital or blood bank.')}</p>

      <form className="requests-create__form" ref={formRef} noValidate onSubmit={handleSubmit} aria-busy={isMutationLoading}>
        <fieldset className="requests-create__fields" disabled={isMutationLoading}>
          <legend className="requests-create__legend">{t('Request information')}</legend>
          <div className="requests-create__field">
            <label className="requests-create__label" htmlFor={fieldId('patientReference')}>{t('Patient reference')}</label>
            <input
              className="requests-create__input"
              id={fieldId('patientReference')}
              name="patientReference"
              ref={patientReferenceRef}
              required
              value={patientReference}
              onChange={handlePatientReferenceChange}
              aria-invalid={Boolean(errors.patientReference)}
              aria-describedby={`${fieldId('patientHelp')}${errors.patientReference ? ` ${fieldId('patientError')}` : ''}`}
            />
            <p className="requests-create__help" id={fieldId('patientHelp')}>{t('Internal hospital code — never enter a patient's personal name')}</p>
            {errors.patientReference && <p className="requests-create__field-error" id={fieldId('patientError')}>{errors.patientReference}</p>}
          </div>

          <div className="requests-create__pair">
            <div className="requests-create__field">
              <label className="requests-create__label" htmlFor={fieldId('bloodType')}>Blood type</label>
              <select
                className="requests-create__input"
                id={fieldId('bloodType')}
                name="bloodType"
                required
                value={bloodType}
                onChange={handleBloodTypeChange}
                aria-invalid={Boolean(errors.bloodType)}
                aria-describedby={errors.bloodType ? fieldId('bloodError') : undefined}
              >
                <option value="">{t('Choose blood type')}</option>
                {bloodTypes.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
              {errors.bloodType && <p className="requests-create__field-error" id={fieldId('bloodError')}>{errors.bloodType}</p>}
            </div>
            <div className="requests-create__field">
              <label className="requests-create__label" htmlFor={fieldId('unitsRequired')}>{t('Units required')}</label>
              <input
                className="requests-create__input"
                id={fieldId('unitsRequired')}
                name="unitsRequired"
                type="number"
                required
                min={MIN_UNITS}
                max={MAX_UNITS}
                step={1}
                value={unitsInput}
                onChange={handleUnitsChange}
                aria-invalid={Boolean(errors.unitsRequired)}
                aria-describedby={errors.unitsRequired ? fieldId('unitsError') : fieldId('unitsHelp')}
              />
              <p className="requests-create__help" id={fieldId('unitsHelp')}>Whole numbers from {MIN_UNITS} to {MAX_UNITS}.</p>
              {errors.unitsRequired && <p className="requests-create__field-error" id={fieldId('unitsError')}>{errors.unitsRequired}</p>}
            </div>
          </div>

          <div className="requests-create__pair">
            <div className="requests-create__field">
              <label className="requests-create__label" htmlFor={fieldId('areaId')}>Area</label>
              <select
                className="requests-create__input"
                id={fieldId('areaId')}
                name="areaId"
                required
                disabled={isAreasLoading || areas.length === 0}
                value={areaId}
                onChange={handleAreaChange}
                aria-invalid={Boolean(errors.areaId)}
                aria-describedby={errors.areaId ? fieldId('areaError') : undefined}
              >
                <option value="">{isAreasLoading ? 'Loading areas...' : 'Choose area'}</option>
                {areas.map((area: Area) => <option key={area.id} value={area.id}>{area.name}</option>)}
              </select>
              {errors.areaId && <p className="requests-create__field-error" id={fieldId('areaError')}>{errors.areaId}</p>}
            </div>
            <div className="requests-create__field">
              <label className="requests-create__label" htmlFor={fieldId('urgency')}>Urgency</label>
              <select
                className="requests-create__input"
                id={fieldId('urgency')}
                name="urgency"
                required
                value={urgency}
                onChange={handleUrgencyChange}
                aria-invalid={Boolean(errors.urgency)}
                aria-describedby={errors.urgency ? fieldId('urgencyError') : undefined}
              >
                <option value="">{t('Choose urgency')}</option>
                {urgencyLevels.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
              {errors.urgency && <p className="requests-create__field-error" id={fieldId('urgencyError')}>{errors.urgency}</p>}
            </div>
          </div>

          {!isAreasLoading && areas.length === 0 && (
            authError ? <ErrorMessage message={authError} onRetry={handleRetryAreas} />
              : <p className="requests-create__help" role="status">{t('No areas are available. A supported area is required to publish a request.')}</p>
          )}

          <div className="requests-create__field">
            <label className="requests-create__label" htmlFor={fieldId('hospital')}>{t('Hospital / blood bank name')}</label>
            <input
              className="requests-create__input"
              id={fieldId('hospital')}
              name="hospital"
              required
              value={hospital}
              onChange={handleHospitalChange}
              aria-invalid={Boolean(errors.hospital)}
              aria-describedby={errors.hospital ? fieldId('hospitalError') : undefined}
            />
            {errors.hospital && <p className="requests-create__field-error" id={fieldId('hospitalError')}>{errors.hospital}</p>}
          </div>
          <div className="requests-create__field">
            <label className="requests-create__label" htmlFor={fieldId('note')}>{t('Note (optional)')}</label>
            <textarea
              className="requests-create__input requests-create__input--note"
              id={fieldId('note')}
              name="note"
              rows={3}
              value={note}
              onChange={handleNoteChange}
            />
          </div>
        </fieldset>

        {mutationError && (
          <div className="requests-create__error" ref={errorRef} tabIndex={-1}>
            <ErrorMessage message={mutationError} />
          </div>
        )}
        {Object.values(errors).some(Boolean) && <p className="requests-create__field-error" role="alert">{t('Please check the highlighted fields.')}</p>}
        {isMutationLoading && <p className="requests-create__help" role="status">{t('Publishing SOS request...')}</p>}
        <Button
          className="requests-create__submit"
          type="submit"
          variant="primary"
          isLoading={isMutationLoading}
          disabled={isMutationLoading || isAreasLoading || areas.length === 0}
        >
          {isMutationLoading ? 'Publishing...' : 'Publish SOS request'}
        </Button>
      </form>
    </dialog>
  );
}
