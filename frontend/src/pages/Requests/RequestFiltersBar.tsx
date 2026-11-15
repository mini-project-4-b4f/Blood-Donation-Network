import type { ChangeEvent, SubmitEvent } from 'react';
import { Button } from '../../components/common/Button';
import { BLOOD_TYPES, REQUEST_STATUSES, URGENCY_LEVELS } from '../../constants';
import type { Area, BloodType } from '../../types/auth.types';
import type { RequestFilters, RequestStatus, Urgency } from '../../types/request.types';

interface RequestFiltersBarProps {
  filters: RequestFilters;
  areas: readonly Area[];
  isAreasLoading: boolean;
  hasFilters: boolean;
  onChange(filters: RequestFilters): void;
  onReset(): void;
}

const bloodTypes: readonly BloodType[] = BLOOD_TYPES;
const requestStatuses: readonly RequestStatus[] = REQUEST_STATUSES;
const urgencyLevels: readonly Urgency[] = URGENCY_LEVELS;

export function RequestFiltersBar({
  filters, areas, isAreasLoading, hasFilters, onChange, onReset,
}: RequestFiltersBarProps) {
  const hasSelectedArea = areas.some((area) => area.id === filters.areaId);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  function handleStatusChange(event: ChangeEvent<HTMLSelectElement>) {
    const status = requestStatuses.find((value) => value === event.currentTarget.value);
    onChange({ ...filters, status });
  }

  function handleBloodTypeChange(event: ChangeEvent<HTMLSelectElement>) {
    const bloodType = bloodTypes.find((value) => value === event.currentTarget.value);
    onChange({ ...filters, bloodType });
  }

  function handleAreaChange(event: ChangeEvent<HTMLSelectElement>) {
    onChange({ ...filters, areaId: event.currentTarget.value || undefined });
  }

  function handleUrgencyChange(event: ChangeEvent<HTMLSelectElement>) {
    const urgency = urgencyLevels.find((value) => value === event.currentTarget.value);
    onChange({ ...filters, urgency });
  }

  return (
    <form className="requests-filters" aria-label="Request filters" onSubmit={handleSubmit}>
      <fieldset className="requests-filters__fields">
        <legend className="requests-filters__legend">Filter blood requests</legend>

        <label className="requests-filters__field" htmlFor="requests-status">
          <span className="requests-filters__label">Status</span>
          <select
            className="requests-filters__select"
            id="requests-status"
            value={filters.status ?? ''}
            onChange={handleStatusChange}
          >
            <option value="">All statuses</option>
            {requestStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>

        <label className="requests-filters__field" htmlFor="requests-blood-type">
          <span className="requests-filters__label">Blood type</span>
          <select
            className="requests-filters__select"
            id="requests-blood-type"
            value={filters.bloodType ?? ''}
            onChange={handleBloodTypeChange}
          >
            <option value="">All blood types</option>
            {bloodTypes.map((bloodType) => <option key={bloodType} value={bloodType}>{bloodType}</option>)}
          </select>
        </label>

        <label className="requests-filters__field" htmlFor="requests-area">
          <span className="requests-filters__label">Area</span>
          <select
            className="requests-filters__select"
            id="requests-area"
            value={filters.areaId ?? ''}
            disabled={isAreasLoading || areas.length === 0}
            onChange={handleAreaChange}
          >
            <option value="">All areas</option>
            {filters.areaId && !hasSelectedArea && <option value={filters.areaId}>Selected area</option>}
            {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
          </select>
        </label>

        <label className="requests-filters__field" htmlFor="requests-urgency">
          <span className="requests-filters__label">Urgency</span>
          <select
            className="requests-filters__select"
            id="requests-urgency"
            value={filters.urgency ?? ''}
            onChange={handleUrgencyChange}
          >
            <option value="">All urgencies</option>
            {urgencyLevels.map((urgency) => <option key={urgency} value={urgency}>{urgency}</option>)}
          </select>
        </label>
      </fieldset>

      <div className="requests-filters__footer">
        <p className="requests-filters__hint" role="status">
          {isAreasLoading ? 'Loading areas...' : areas.length === 0 ? 'No areas are available. Other filters remain usable.' : 'Filters update the requests list automatically.'}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={onReset} disabled={!hasFilters}>
          Reset filters
        </Button>
      </div>
    </form>
  );
}
