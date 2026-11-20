import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import type { DonationHistoryItem } from '../../types/donor.types';

interface DonationHistoryTableProps {
  history: DonationHistoryItem[];
}

export const DonationHistoryTable: React.FC<DonationHistoryTableProps> = ({ history }) => {
  const { t } = useLanguage();
  return (
    <div className="donor-dashboard-section">
      <h3 className="donor-dashboard-section__title"{t('My Completed Past Donations History')}</h3>
      <div className="donor-dashboard-table-container">
        <table className="donor-dashboard-table">
          <thead>
            <tr>
              <th>{t('Donation Date')}</th>
              <th>{t('Hospital / Blood Bank')}</th>
              <th>{t('Area')}</th>
              <th>{t('Blood type')}</th>
              <th>{t('Quantity')}</th>
            </tr>
          </thead>
          <tbody>
            {(!history || history.length === 0) ? (
              <tr>
                <td colSpan={5} className="text-center"{t('No completed past donations found.')}</td>
              </tr>
            ) : (
              history.map((item) => (
                <tr key={item.id}>
                  <td>{item.donationDate}</td>
                  <td>{item.request.hospital}</td>
                  <td>{item.request.area.name}</td>
                  <td>
                    <span className="donor-dashboard-blood-badge-sm">{item.request.bloodType}</span>
                  </td>
                  <td><strong>{item.units} {t('unit')}</strong></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};