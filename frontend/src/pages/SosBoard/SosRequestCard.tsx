import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { PublicSosRequest } from '../../types/request.types';
import { formatDateTime, formatUnits } from '../../utils/format';
import BloodTypeBadge from '../../components/common/BloodTypeBadge';
import UrgencyBadge from '../../components/common/UrgencyBadge';
import './SosRequestCard.css';

export default function SosRequestCard({ request }: { request: PublicSosRequest }) {
  const { user } = useAuth();
  const destination = user?.role === 'DONOR' ? '/donor/dashboard' : user?.role === 'COORDINATOR' ? '/coordinator/requests' : '/sign-in';
  const action = user?.role === 'DONOR' ? 'See requests I can help with' : user?.role === 'COORDINATOR' ? 'Manage requests' : 'Can you help? Sign in to pledge';
  return (
    <article className="sos-board-card" aria-label={`${request.bloodType} blood request at ${request.hospital}`}>
      <div className="sos-board-card__badges"><BloodTypeBadge bloodType={request.bloodType} /><UrgencyBadge urgency={request.urgency} /></div>
      <h3 className="sos-board-card__hospital">{request.hospital}</h3>
      <p className="sos-board-card__area"><span aria-hidden="true">◎</span> {request.area.name}</p>
      <p className="sos-board-card__units"><strong>{formatUnits(request.unitsStillNeeded)}</strong> still needed</p>
      <time className="sos-board-card__time" dateTime={request.createdAt}>Posted {formatDateTime(request.createdAt)} UTC</time>
      <Link className="sos-board-card__action" to={destination}>{action} <span aria-hidden="true">→</span></Link>
    </article>
  );
}
