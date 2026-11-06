
import { useDonor } from '../../context/DonorContext';
import { EligibilityBanner } from './EligibilityBanner';
import { ActivePledgeCard } from './ActivePledgeCard';
import { EligibleRequestsList } from './EligibleRequestsList';
import { DonationHistoryTable } from './DonationHistoryTable';
import './pages/DonorDashboard/DonorDashboardPage.css';
export const DonorDashboardPage = () => {
  const {
    profile,
    eligibleRequests,
    isLoading,
    isActionLoading,
    error,
    actionError,
    createPledge,
    withdrawPledge,
  } = useDonor();

  if (isLoading) {
    return (
      <div className="donor-dashboard-loading" role="status">
        <p>Loading donor dashboard...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="donor-dashboard-error" role="alert">
        <p>{error || 'Failed to load profile data.'}</p>
      </div>
    );
  }

  return (
    <div className="donor-dashboard">
      <div className="donor-dashboard__header-section">
        <span className="donor-dashboard__eyebrow">Donor Dashboard</span>
        

        <div className="donor-dashboard__header-flex">
          <h1 className="donor-dashboard__welcome">Welcome back, {profile.fullName}</h1>
          <div className="donor-dashboard__inline-badges">
            <span className="donor-dashboard__meta-badge donor-dashboard__meta-badge--blood">
              Blood Type: {profile.bloodType}
            </span>
            <span className="donor-dashboard__meta-badge donor-dashboard__meta-badge--area">
              Area: {profile.area.name}
            </span>
          </div>
        </div>
      </div>

      {actionError && (
        <div className="donor-dashboard-alert donor-dashboard-alert--error" role="alert">
          {actionError}
        </div>
      )}

      <EligibilityBanner profile={profile} />

      <ActivePledgeCard
        pledge={profile.activePledge ?? null}
        onWithdraw={withdrawPledge}
        isLoading={isActionLoading}
      />

      <EligibleRequestsList
        requests={eligibleRequests}
        hasActivePledge={!!profile.activePledge}
        onPledge={createPledge}
        isLoading={isActionLoading}
      />

      <DonationHistoryTable history={profile.donationHistory} />
    </div>
  );
};