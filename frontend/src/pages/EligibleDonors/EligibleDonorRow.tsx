import { useLanguage } from '../../context/LanguageContext';
import { BloodTypeBadge } from '../../components/common/BloodTypeBadge';
import { Button } from '../../components/common/Button';
import type { RankedEligibleDonor } from '../../types/request.types';
import { formatDate, formatPhone } from '../../utils/format';

interface EligibleDonorRowProps {
  donor: RankedEligibleDonor;
  isActionDisabled: boolean;
  onRecordDonation(donorId: string): void;
}

export function EligibleDonorRow({ donor, isActionDisabled, onRecordDonation }: EligibleDonorRowProps) {
  const { t } = useLanguage();
  function handleRecordDonation() {
    onRecordDonation(donor.id);
  }

  return (
    <tr className="eligible-donors-row">
      <td className="eligible-donors-row__cell eligible-donors-row__rank">#{donor.rank}</td>
      <th className="eligible-donors-row__cell" scope="row">
        <span className="eligible-donors-row__name">{donor.fullName}</span>
        <span className="eligible-donors-row__phone"><bdi>{formatPhone(donor.phone)}</bdi></span>
      </th>
      <td className="eligible-donors-row__cell">
        <div className="eligible-donors-row__badges">
          <BloodTypeBadge bloodType={donor.bloodType} isExactMatch={donor.isExactBloodMatch} />
          <span className={`eligible-donors-row__match${donor.isExactBloodMatch ? ' eligible-donors-row__match--exact' : ''}`}>
            {donor.isExactBloodMatch ? t('Exact Match') : t('Compatible')}
          </span>
        </div>
      </td>
      <td className="eligible-donors-row__cell">{donor.area.name}</td>
      <td className="eligible-donors-row__cell">
        {donor.lastDonationDate ? (
          <time dateTime={donor.lastDonationDate}>{formatDate(donor.lastDonationDate)}</time>
        ) : <span className="eligible-donors-row__never">{t('Never donated')}</span>}
      </td>
      <td className="eligible-donors-row__cell">
        {donor.hasActivePledgeForThisRequest ? (
          <span className="eligible-donors-row__pledge">{t('Active Pledge')}</span>
        ) : <span className="eligible-donors-row__no-pledge">{t('No active pledge')}</span>}
      </td>
      <td className="eligible-donors-row__cell">
        <Button
          className="eligible-donors-row__action"
          type="button"
          variant="primary"
          size="sm"
          aria-label={`${t("Record donation for")} ${donor.fullName}`}
          aria-haspopup="dialog"
          disabled={isActionDisabled}
          onClick={handleRecordDonation}
        >
          Record donation
        </Button>
      </td>
    </tr>
  );
}
