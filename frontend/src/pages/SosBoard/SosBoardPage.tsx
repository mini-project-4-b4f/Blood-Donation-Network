import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useRequests } from '../../context/RequestsContext';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import ErrorMessage from '../../components/common/ErrorMessage';
import Loading from '../../components/common/Loading';
import SosRequestCard from './SosRequestCard';
import './SosBoardPage.css';

export default function SosBoardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { sosRequests, isSosLoading, sosError, loadSosRequests } = useRequests();
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => { if (active) return loadSosRequests(); });
    return () => { active = false; };
  }, [loadSosRequests]);

  return <div className="sos-board-page">
    <section className="sos-board-page__hero" aria-labelledby="sos-board-heading">
      <div className="sos-board-page__hero-copy">
        <span className="sos-board-page__eyebrow">{t('YOUR COMMUNITY. YOUR CHANCE TO HELP.')}</span>
        <h1 id="sos-board-heading">{t('Someone needs blood.')}<br /><span>{t('You could be their hope.')}</span></h1>
        <p>{t('When a patient needs blood urgently, find the right donors in the right area — fast. A simple pledge can be the start of something life-changing.')}</p>
        <div className="sos-board-page__actions">
          {user ? <Link className="sos-board-page__primary" to={user.role === 'DONOR' ? '/donor/dashboard' : '/coordinator/requests'}>{user.role === 'DONOR' ? t('Go to My Dashboard') : t('Manage Requests')} <span aria-hidden="true">→</span></Link> : <><Link className="sos-board-page__primary" to="/sign-up">{t('Become a Donor')} <span aria-hidden="true">→</span></Link><Link className="sos-board-page__secondary" to="/sign-in">{t('Sign In')}</Link></>}
        </div>
      </div>
      <div className="sos-board-page__hero-art" aria-hidden="true"><div className="sos-board-page__heart">♡</div><p>{t('A small act.')}<br /><strong>{t('A second chance.')}</strong></p></div>
    </section>
    <div className="sos-board-page__trust"><span>♡ {t('Volunteer-powered')}</span><span>◎ {t('Local communities')}</span><span>✓ {t('Private by design')}</span></div>
    <section aria-labelledby="sos-requests-heading">
      <header className="sos-board-page__section-heading">
        <div><span className="sos-board-page__eyebrow">{t('PUBLIC SOS BOARD')}</span><h2 id="sos-requests-heading">{t('Blood needed, hope shared.')}</h2><p>{t('Open requests from hospitals and blood banks, with the most urgent first.')}</p></div>
        <Button variant="outline" size="sm" aria-label={t('Refresh requests')} isLoading={isSosLoading} onClick={() => void loadSosRequests()}>↻ {t('Refresh requests')}</Button>
      </header>
      {isSosLoading && <Loading message={t('Loading blood requests…')} />}
      {!isSosLoading && sosError && <ErrorMessage message={sosError} onRetry={() => void loadSosRequests()} />}
      {!isSosLoading && !sosError && sosRequests.length === 0 && <EmptyState title={t('No active SOS blood requests right now.')} description={t('All current hospital needs have been met.')} action={!user && <Link to="/sign-up">{t('Join the donor community')}</Link>} />}
      {!isSosLoading && !sosError && sosRequests.length > 0 && <div className="sos-board-page__grid">{sosRequests.map((request) => <SosRequestCard key={request.id} request={request} />)}</div>}
    </section>
    <section className="sos-board-page__help"><span aria-hidden="true">♡</span><div><h2>{t("You don't have to wait for an emergency to make a difference.")}</h2><p>{t('Join the network today and be ready when your community needs you.')}</p></div>{!user && <Link to="/sign-up">{t('Become a donor')} →</Link>}</section>
  </div>;
}
