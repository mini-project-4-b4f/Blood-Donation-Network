import { useLanguage } from '../../context/LanguageContext';
import type { BloodType } from '../../types/auth.types';
import './BloodTypeBadge.css';

interface BloodTypeBadgeProps { bloodType: BloodType; isExactMatch?: boolean }

export function BloodTypeBadge({ bloodType, isExactMatch = false }: BloodTypeBadgeProps) {
  const { t } = useLanguage();
  return (
    <span className="ui-blood-type">
      <span className="ui-blood-type__value" aria-label={`${t("Blood type")} ${bloodType}`}>{bloodType}</span>
      {isExactMatch && <span className="ui-blood-type__match">{t('Exact Match')}</span>}
    </span>
  );
}

export default BloodTypeBadge;
