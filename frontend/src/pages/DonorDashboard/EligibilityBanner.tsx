import React from 'react';
import type { DonorDashboardProfile } from '../../types/donor.types';

interface EligibilityBannerProps {
  profile: DonorDashboardProfile;
}

export const EligibilityBanner: React.FC<EligibilityBannerProps> = ({ profile }) => {
  const { eligibilityStatus, nextAllowedDonationDate, isAvailable, isActive } = profile;

  if (!isActive) {
    return (
      <div className="donor-dashboard-banner donor-dashboard-banner--inactive" role="alert">
        <div className="donor-dashboard-banner__icon">⚠️</div>
        <div className="donor-dashboard-banner__content">
          <h3 className="donor-dashboard-banner__title">Account Deactivated</h3>
          <p className="donor-dashboard-banner__desc">
            Your account is currently deactivated. You can reactivate it from your profile page.
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
          <h3 className="donor-dashboard-banner__title">Rest & Recovery Period (REST PERIOD)</h3>
          <p className="donor-dashboard-banner__desc">
            You are in a rest period until <strong>{nextAllowedDonationDate || '01-08-2026'}</strong>.
            <span className="donor-dashboard-banner__sub"> According to safe donation rules (56-day period), you can donate again after this date.</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="donor-dashboard-banner donor-dashboard-banner--eligible" role="status">
      <div className="donor-dashboard-banner__icon">✅</div>
      <div className="donor-dashboard-banner__content">
        <h3 className="donor-dashboard-banner__title">You Are Eligible to Donate!</h3>
        <p className="donor-dashboard-banner__desc">Your health status is great and you are ready to save lives.</p>
      </div>
    </div>
  );
};