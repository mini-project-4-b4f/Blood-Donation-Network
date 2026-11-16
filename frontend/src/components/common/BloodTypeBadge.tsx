import type { BloodType } from '../../types/auth.types';
import './BloodTypeBadge.css';

interface BloodTypeBadgeProps { bloodType: BloodType; isExactMatch?: boolean }

export function BloodTypeBadge({ bloodType, isExactMatch = false }: BloodTypeBadgeProps) {
  return (
    <span className="ui-blood-type">
      <span className="ui-blood-type__value" aria-label={`Blood type ${bloodType}`}>{bloodType}</span>
      {isExactMatch && <span className="ui-blood-type__match">Exact Match</span>}
    </span>
  );
}

export default BloodTypeBadge;
