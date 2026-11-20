import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import type { DonorDashboardProfile } from '../../types/donor.types';

interface EligibilityBannerProps {
  profile: DonorDashboardProfile;
}

export const EligibilityBanner: React.FC<EligibilityBannerProps> = ({ profile }) => {
  const { t } = useLanguage();
  const { eligibilityStatus, nextAllowedDonationDate, isActive } = profile;

  if (!isActive) {
    return (
      <div className="donor-dashboard-banner donor-dashboard-banner--inactive" role="alert">
        <div className="donor-dashboard-banner__icon">⚠️</div>
        <div className="donor-dashboard-banner__content">
          <h3 className="donor-dashboard-banner__title"{t('Account Deactivated')}</h3>
          <p className="donor-dashboard-banner__desc">
            {t('Your account is currently deactivated.')}
          </p>
        </div>
      </div>
    );
  }

  if (eligibilityStatus === 'REST_PERIOD') {
    return (
      <div className="donor-dashboard-banner donor-dashboard-banner--rest" role="status">
        <div className="donor-dashboard-banner__icon">⏳</div>
        <div className="donor-dashboard-banner__content">
          <h3 className="donor-dashboard-banner__title"{t('Rest & Recovery Period (REST PERIOD)')}</h3>
          <p className="donor-dashboard-banner__desc">
            {nextAllowedDonationDate ? <>{t('You are in a rest period until')} <strong>{nextAllowedDonationDate}</strong>.</> : t('You are in a rest period.')}
          </p>
        </div>
      </div>
    );
  }

  if (eligibilityStatus === 'UNAVAILABLE') {
    return <p role="status">{t('Your profile is currently marked as unavailable to donate.')}</p>;
  }

  return (
    <div className="donor-dashboard-banner donor-dashboard-banner--eligible" role="status">
      <div className="donor-dashboard-banner__icon">✅</div>
      <div className="donor-dashboard-banner__content">
        <h3 className="donor-dashboard-banner__title"{t('You Are Eligible to Donate!')}</h3>
        <p className="donor-dashboard-banner__desc">{t('Your profile meets the network’s eligibility rules.')}</p>
      </div>
    </div>
  );
};
