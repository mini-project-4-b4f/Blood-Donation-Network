import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import type { PublicSosRequest } from '../../types/request.types';
import {  formatUnits } from '../../utils/format';
import BloodTypeBadge from '../../components/common/BloodTypeBadge';
import UrgencyBadge from '../../components/common/UrgencyBadge';
import './SosRequestCard.css';

export default function SosRequestCard({ request }: { request: PublicSosRequest }) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const destination = user?.role === 'DONOR' ? '/donor/dashboard' : user?.role === 'COORDINATOR' ? '/coordinator/requests' : '/sign-in';
  const action = user?.role === 'DONOR' ? t('See requests I can help with') : user?.role === 'COORDINATOR' ? t('Manage Requests') : t('Can you help? Sign in to pledge');
  return (
    <article className="sos-board-card" aria-label={`${request.bloodType} ${t('blood request at')} ${request.hospital}`}>
      <div className="sos-board-card__badges"><BloodTypeBadge bloodType={request.bloodType} /><UrgencyBadge urgency={request.urgency} /></div>
      <h3 className="sos-board-card__hospital">{request.hospital}</h3>
      <p className="sos-board-card__area"><span aria-hidden="true">◎</span> {request.area.name}</p>
      <p className="sos-board-card__units"><strong>{formatUnits(request.unitsStillNeeded)}</strong> {t('still needed')}</p>
      <time className="sos-board-card__time" dateTime={request.createdAt}>{t('Posted')} {new Intl.DateTimeFormat(language === 'ar' ? 'ar' : 'en', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(request.createdAt))} UTC</time>
      <Link className="sos-board-card__action" to={destination}>{action} <span aria-hidden="true">→</span></Link>
    </article>
  );
}
