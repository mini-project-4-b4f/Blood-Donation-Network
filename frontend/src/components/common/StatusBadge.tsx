import type { EligibilityStatus, PledgeStatus } from '../../types/donor.types';
import type { RequestStatus } from '../../types/request.types';
import './StatusBadge.css';

type Status = RequestStatus | PledgeStatus | EligibilityStatus;
const STATUS_TONES: Record<Status, string> = {
  OPEN: 'active', FULFILLED: 'success', CANCELLED: 'neutral',
  PLEDGED: 'info', COMPLETED: 'success', WITHDRAWN: 'neutral', RELEASED: 'warning',
  ELIGIBLE: 'success', REST_PERIOD: 'warning', UNAVAILABLE: 'neutral', INACTIVE: 'error',
};

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`ui-status-badge ui-status-badge--${STATUS_TONES[status]}`}>{status.replaceAll('_', ' ')}</span>;
}

export default StatusBadge;
