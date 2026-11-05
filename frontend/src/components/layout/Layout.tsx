import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import './Layout.css';

export default function Layout() {
  const { user, token, signOut } = useAuth();
  const navigate = useNavigate();
  function handleSignOut() { signOut(); navigate('/'); }

  return (
    <div className="layout-page">
      <a className="layout-page__skip" href="#main-content">Skip to content</a>
      <header className="layout-navbar">
        <Link className="layout-navbar__brand" to="/" aria-label="Blood Donation Network home">
          <span className="layout-navbar__mark" aria-hidden="true">♥</span>
          <span>Blood Donation<span className="layout-navbar__subtitle">NETWORK</span></span>
        </Link>
        <nav className="layout-navbar__links" aria-label="Main navigation">
          <Link to="/">SOS Board</Link>
          {user?.role === 'DONOR' && <><Link to="/donor/dashboard">My Dashboard</Link><Link to="/donor/profile">My Profile</Link></>}
          {user?.role === 'COORDINATOR' && <Link to="/coordinator/requests">Manage Requests</Link>}
          {user && <span className="layout-navbar__identity">{user.donorProfile?.fullName ?? user.email ?? user.phone}{user.donorProfile ? ` · ${user.donorProfile.bloodType}` : ' · Coordinator'}</span>}
          {token ? <Button variant="outline" size="sm" onClick={handleSignOut}>Sign Out</Button> : <><Link to="/sign-in">Sign In</Link><Link className="layout-navbar__join" to="/sign-up">Become a Donor</Link></>}
        </nav>
      </header>
      <main id="main-content" className="layout-page__main"><Outlet /></main>
      <footer className="layout-footer">
        <strong>One community. Many lives.</strong>
        <p>Connecting volunteer donors with hospitals that need them.</p>
        <p className="layout-footer__note">Donation eligibility is confirmed by qualified healthcare staff before every donation.</p>
      </footer>
    </div>
  );
}
