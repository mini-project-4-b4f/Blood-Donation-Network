import { useDonor } from '../../context/DonorContext';
import { useLanguage } from '../../context/LanguageContext';
import { EligibilityBanner } from './EligibilityBanner';
import { ActivePledgeCard } from './ActivePledgeCard';
import { EligibleRequestsList } from './EligibleRequestsList';
import { DonationHistoryTable } from './DonationHistoryTable';
import './DonorDashboardPage.css';

export const DonorDashboardPage = () => {
  const { t } = useLanguage();
  const {
    profile, eligibleRequests, isLoading, isActionLoading, error, actionError,
    createPledge, withdrawPledge,
  } = useDonor();

  if (isLoading) {
    return <div className="donor-dashboard-loading" role="status"><p>{t('Loading donor dashboard...')}</p></div>;
  }

  if (error || !profile) {
    return <div className="donor-dashboard-error" role="alert"><p>{error ? t(error) : t('Failed to load profile data.')}</p></div>;
  }

  return (
    <div className="donor-dashboard">
      <div className="donor-dashboard__header-section">
        <span className="donor-dashboard__eyebrow">{t('Donor Dashboard')}</span>
        <div className="donor-dashboard__header-flex">
          <h1 className="donor-dashboard__welcome">{t('Welcome back,')} {profile.fullName}</h1>
          <div className="donor-dashboard__inline-badges">
            <span className="donor-dashboard__meta-badge donor-dashboard__meta-badge--blood">{t('Blood Type:')} {profile.bloodType}</span>
            <span className="donor-dashboard__meta-badge donor-dashboard__meta-badge--area">{t('Area:')} {profile.area.name}</span>
          </div>
        </div>
      </div>
      {actionError && <div className="donor-dashboard-alert donor-dashboard-alert--error" role="alert">{t(actionError)}</div>}
      <EligibilityBanner profile={profile} />
      <ActivePledgeCard pledge={profile.activePledge ?? null} onWithdraw={withdrawPledge} isLoading={isActionLoading} />
      <EligibleRequestsList requests={eligibleRequests} hasActivePledge={!!profile.activePledge} onPledge={createPledge} isLoading={isActionLoading} />
      <DonationHistoryTable history={profile.donationHistory} />
    </div>
  );
};
