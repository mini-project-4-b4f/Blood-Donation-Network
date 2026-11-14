import React from 'react';
import type { ActivePledge } from '../../types/donor.types';

interface ActivePledgeCardProps {
  pledge: ActivePledge | null;
  onWithdraw: (pledgeId: string) => Promise<void>;
  isLoading: boolean;
}

export const ActivePledgeCard: React.FC<ActivePledgeCardProps> = ({ pledge, onWithdraw, isLoading }) => {
  if (!pledge) {
    return (
      <div className="donor-dashboard-card donor-dashboard-card--empty-pledge">
        <h3 className="donor-dashboard-card__title">Active Pledge</h3>
        <p className="donor-dashboard-card__text">You do not have any active donation pledges right now. You can select a request from the available list below and pledge to help.</p>
      </div>
    );
  }

  const { request } = pledge;

  return (
    <div className="donor-dashboard-card donor-dashboard-card--active-pledge">
      <div className="donor-dashboard-card__header">
        <h3 className="donor-dashboard-card__title">You Have an Active Pledge! 🩸</h3>
        <span className={`donor-dashboard-badge donor-dashboard-badge--${request.urgency.toLowerCase()}`}>
          {request.urgency}
        </span>
      </div>

      <div className="donor-dashboard-card__body">
        <div className="donor-dashboard-info-row">
          Required Blood Type: <strong>{request.bloodType}</strong>
        </div>
        <div className="donor-dashboard-info-row">
          Hospital: <strong>{request.hospital}</strong>
        </div>
        <div className="donor-dashboard-info-row">
          Area: <strong>{request.area.name}</strong>
        </div>
        <div className="donor-dashboard-info-row">
          Collected / Required Units: <strong>{request.unitsCollected} / {request.unitsRequired}</strong>
        </div>
      </div>

      <div className="donor-dashboard-card__footer">
        <button
          className="donor-dashboard-btn donor-dashboard-btn--danger"
          disabled={isLoading}
          onClick={() => onWithdraw(pledge.id)}
        >
          {isLoading ? 'Withdrawing...' : 'Withdraw Pledge'}
        </button>
      </div>
    </div>
  );
};