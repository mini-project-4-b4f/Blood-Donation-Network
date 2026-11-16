import type { Urgency } from '../../types/request.types';
import './UrgencyBadge.css';

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  return <span className={`ui-urgency-badge ui-urgency-badge--${urgency.toLowerCase()}`}>{urgency}</span>;
}

export default UrgencyBadge;
