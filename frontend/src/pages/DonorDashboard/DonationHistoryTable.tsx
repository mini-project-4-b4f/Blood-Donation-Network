import React from 'react';
import type { DonationHistoryItem } from '../../types/donor.types';

interface DonationHistoryTableProps {
  history: DonationHistoryItem[];
}

export const DonationHistoryTable: React.FC<DonationHistoryTableProps> = ({ history }) => {
  return (
    <div className="donor-dashboard-section">
      <h3 className="donor-dashboard-section__title"> My Completed Past Donations History</h3>
      <div className="donor-dashboard-table-container">
        <table className="donor-dashboard-table">
          <thead>
            <tr>
              <th>Donation Date</th>
              <th>Hospital / Blood Bank</th>
              <th>Area</th>
              <th>Blood Type</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {(!history || history.length === 0) ? (
              <tr>
                <td colSpan={5} className="text-center">No completed past donations found.</td>
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
                  <td><strong>{item.units} unit</strong></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};