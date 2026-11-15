import { Link } from 'react-router-dom';
import { BloodTypeBadge } from '../../components/common/BloodTypeBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { UrgencyBadge } from '../../components/common/UrgencyBadge';
import type { CoordinatorRequestSummary } from '../../types/request.types';
import { formatDateTime, formatUnits } from '../../utils/format';

interface RequestsTableProps {
  requests: readonly CoordinatorRequestSummary[];
}

export function RequestsTable({ requests }: RequestsTableProps) {
  return (
    <div className="requests-table__scroll" role="region" aria-label="Blood requests table, scroll horizontally for more columns" tabIndex={0}>
      <table className="requests-table">
        <caption className="requests-table__caption">Coordinator blood requests</caption>
        <thead className="requests-table__head">
          <tr>
            <th className="requests-table__heading" scope="col">Reference / hospital</th>
            <th className="requests-table__heading" scope="col">Blood type / area</th>
            <th className="requests-table__heading" scope="col">Urgency</th>
            <th className="requests-table__heading" scope="col">Status</th>
            <th className="requests-table__heading" scope="col">Units collected / required</th>
            <th className="requests-table__heading" scope="col">Active pledges</th>
            <th className="requests-table__heading" scope="col">Created</th>
            <th className="requests-table__heading" scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => {
            const detailsPath = `/coordinator/requests/${encodeURIComponent(request.id)}`;

            return (
              <tr className="requests-table__row" key={request.id}>
                <th className="requests-table__cell requests-table__cell--identity" scope="row">
                  <span className="requests-table__hospital">{request.hospital}</span>
                  <span className="requests-table__secondary">Reference: <bdi>{request.patientReference}</bdi></span>
                </th>
                <td className="requests-table__cell">
                  <div className="requests-table__blood-area">
                    <BloodTypeBadge bloodType={request.bloodType} />
                    <span>{request.area.name}</span>
                  </div>
                </td>
                <td className="requests-table__cell"><UrgencyBadge urgency={request.urgency} /></td>
                <td className="requests-table__cell"><StatusBadge status={request.status} /></td>
                <td className="requests-table__cell">
                  <div className="requests-table__units">
                    <span className="requests-table__unit-count">{request.unitsCollected} / {request.unitsRequired} units</span>
                    <progress
                      className="requests-table__progress"
                      value={request.unitsCollected}
                      max={request.unitsRequired}
                      aria-label={`Units collected for ${request.patientReference}`}
                    />
                    <span className="requests-table__secondary">{formatUnits(request.unitsStillNeeded)} still needed</span>
                  </div>
                </td>
                <td className="requests-table__cell">{request.activePledgesCount}</td>
                <td className="requests-table__cell">
                  <time className="requests-table__created" dateTime={request.createdAt}>{formatDateTime(request.createdAt)}</time>
                </td>
                <td className="requests-table__cell">
                  <div className="requests-table__actions">
                    <Link className="requests-table__link" to={detailsPath} aria-label={`View details for ${request.patientReference}`}>View details</Link>
                    {request.status === 'OPEN' && (
                      <Link
                        className="requests-table__link requests-table__link--secondary"
                        to={`${detailsPath}/eligible-donors`}
                        aria-label={`Find eligible donors for ${request.patientReference}`}
                      >
                        Eligible donors
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
