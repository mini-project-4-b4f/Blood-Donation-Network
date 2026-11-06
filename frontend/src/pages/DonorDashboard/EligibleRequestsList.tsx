import React from 'react';
import type { EligibleOpenRequest } from '../../types/donor.types';

interface EligibleRequestsListProps {
  requests: EligibleOpenRequest[];
  hasActivePledge: boolean;
  onPledge: (requestId: string) => Promise<void>;
  isLoading: boolean;
}

export const EligibleRequestsList: React.FC<EligibleRequestsListProps> = ({
  requests,
  hasActivePledge,
  onPledge,
  isLoading,
}) => {
  return (
    <div className="donor-dashboard-section">
      <div className="donor-dashboard-section__header-row">
        <h3 className="donor-dashboard-section__title"> Emergency Requests I Can Help With in My Area (Homs)</h3>
        <span className="donor-dashboard-section__subtitle-tag">Blood types compatible with you</span>
      </div>

      {requests.length === 0 ? (
        <div className="donor-dashboard-card donor-dashboard-card--empty">
          <p>No open blood donation requests matching your area right now.</p>
        </div>
      ) : (
        <div className="donor-dashboard-requests-grid">
          {requests.map((request) => (
            <div key={request.id} className="donor-dashboard-request-card">
              <div className="donor-dashboard-request-card__main-info">
                <span className="donor-dashboard-blood-badge-lg">{request.bloodType}</span>
                <div className="donor-dashboard-request-card__details">
                  <div className="donor-dashboard-request-card__top-line">
                    <h4 className="donor-dashboard-request-card__hospital">{request.hospital}</h4>
                    <span className="donor-dashboard-badge donor-dashboard-badge--critical">CRITICAL</span>
                  </div>
                  <p className="donor-dashboard-request-card__desc">Emergency open heart surgery case - Surgery in progress.</p>
                  <p className="donor-dashboard-request-card__units">Remaining: <strong>{request.unitsStillNeeded} units</strong></p>
                </div>
              </div>

              <div className="donor-dashboard-request-card__action">
                <button
                  className="donor-dashboard-btn donor-dashboard-btn--primary"
                  disabled={isLoading || !request.canPledge || hasActivePledge}
                  onClick={() => onPledge(request.id)}
                >
                  {isLoading ? 'Processing...' : 'Pledge to Donate (Pledge)'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};