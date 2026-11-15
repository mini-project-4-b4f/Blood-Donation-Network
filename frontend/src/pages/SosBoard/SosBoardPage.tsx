import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useRequests } from '../../context/RequestsContext';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import ErrorMessage from '../../components/common/ErrorMessage';
import Loading from '../../components/common/Loading';
import SosRequestCard from './SosRequestCard';
import './SosBoardPage.css';

export default function SosBoardPage() {
  const { user } = useAuth();
  const { sosRequests, isSosLoading, sosError, loadSosRequests } = useRequests();
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => { if (active) return loadSosRequests(); });
    return () => { active = false; };
  }, [loadSosRequests]);

  return <div className="sos-board-page">
    <section className="sos-board-page__hero" aria-labelledby="sos-board-heading">
      <div className="sos-board-page__hero-copy">
        <span className="sos-board-page__eyebrow">YOUR COMMUNITY. YOUR CHANCE TO HELP.</span>
        <h1 id="sos-board-heading">Someone needs blood.<br /><span>You could be their hope.</span></h1>
        <p>When a patient needs blood urgently, find the right donors in the right area — fast. A simple pledge can be the start of something life-changing.</p>
        <div className="sos-board-page__actions">
          {user ? <Link className="sos-board-page__primary" to={user.role === 'DONOR' ? '/donor/dashboard' : '/coordinator/requests'}>{user.role === 'DONOR' ? 'Go to My Dashboard' : 'Manage Requests'} <span aria-hidden="true">→</span></Link> : <><Link className="sos-board-page__primary" to="/sign-up">Become a Donor <span aria-hidden="true">→</span></Link><Link className="sos-board-page__secondary" to="/sign-in">Sign In</Link></>}
        </div>
      </div>
      <div className="sos-board-page__hero-art" aria-hidden="true"><div className="sos-board-page__heart">♡</div><p>A small act.<br /><strong>A second chance.</strong></p></div>
    </section>
    <div className="sos-board-page__trust"><span>♡ Volunteer-powered</span><span>◎ Local communities</span><span>✓ Private by design</span></div>
    <section aria-labelledby="sos-requests-heading">
      <header className="sos-board-page__section-heading">
        <div><span className="sos-board-page__eyebrow">PUBLIC SOS BOARD</span><h2 id="sos-requests-heading">Blood needed, hope shared.</h2><p>Open requests from hospitals and blood banks, with the most urgent first.</p></div>
        <Button variant="outline" size="sm" aria-label="Refresh requests" isLoading={isSosLoading} onClick={() => void loadSosRequests()}>↻ Refresh requests</Button>
      </header>
      {isSosLoading && <Loading message="Loading blood requests…" />}
      {!isSosLoading && sosError && <ErrorMessage message={sosError} onRetry={() => void loadSosRequests()} />}
      {!isSosLoading && !sosError && sosRequests.length === 0 && <EmptyState title="No active SOS blood requests right now." description="All current hospital needs have been met." action={!user && <Link to="/sign-up">Join the donor community</Link>} />}
      {!isSosLoading && !sosError && sosRequests.length > 0 && <div className="sos-board-page__grid">{sosRequests.map((request) => <SosRequestCard key={request.id} request={request} />)}</div>}
    </section>
    <section className="sos-board-page__help"><span aria-hidden="true">♡</span><div><h2>You don't have to wait for an emergency to make a difference.</h2><p>Join the network today and be ready when your community needs you.</p></div>{!user && <Link to="/sign-up">Become a donor →</Link>}</section>
  </div>;
}
