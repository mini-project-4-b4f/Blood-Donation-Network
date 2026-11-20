import { useLanguage } from '../../context/LanguageContext';
import type { Urgency } from '../../types/request.types';
import './UrgencyBadge.css';

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  const { t } = useLanguage();
  return <span className={`ui-urgency-badge ui-urgency-badge--${urgency.toLowerCase()}`}>{t(urgency)}</span>;
}

export default UrgencyBadge;
