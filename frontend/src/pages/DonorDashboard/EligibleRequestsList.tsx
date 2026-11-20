import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
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
        <h3 className="donor-dashboard-section__title"{t('Emergency Requests I Can Help With')}</h3>
        <span className="donor-dashboard-section__subtitle-tag"{t('Blood types compatible with you')}</span>
      </div>

      {requests.length === 0 ? (
        <div className="donor-dashboard-card donor-dashboard-card--empty">
          <p>{t('No open blood donation requests matching your area right now.')}</p>
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
                    <span className={`donor-dashboard-badge donor-dashboard-badge--${request.urgency.toLowerCase()}`}>{request.urgency}</span>
                  </div>
                  <p className="donor-dashboard-request-card__desc">{t('Area:')} {request.area.name} · {t('Active pledges:')} {request.activePledgesCount}</p>
                  <p className="donor-dashboard-request-card__units">{t('Remaining:')} <strong>{request.unitsStillNeeded} {t('units')}</strong></p>
                </div>
              </div>

              <div className="donor-dashboard-request-card__action">
                <button
                  className="donor-dashboard-btn donor-dashboard-btn--primary"
                  disabled={isLoading || !request.canPledge || hasActivePledge}
                  onClick={() => onPledge(request.id)}
                >
                  {isLoading ? t('Processing...') : t('Pledge to Donate (Pledge)')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};