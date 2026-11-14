import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BloodTypeBadge from '../common/BloodTypeBadge';
import { buttonClassName } from '../common/Button';
import './Navbar.css';

function navLinkClassName({ isActive }: { isActive: boolean }): string {
  return isActive ? 'layout-navbar__link layout-navbar__link--active' : 'layout-navbar__link';
}

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  return (
    <header className="layout-navbar">
      <div className="layout-navbar__inner">
        <Link to="/" className="layout-navbar__brand">
          <span className="layout-navbar__logo" aria-hidden="true">♥</span>
          <span className="layout-navbar__brand-text">
            <span className="layout-navbar__title">Blood Donation Network</span>
          </span>
        </Link>

        <nav className="layout-navbar__nav" aria-label="Main navigation">
          <NavLink to="/" end className={navLinkClassName}>
            SOS Board
          </NavLink>
          {user?.role === 'DONOR' && (
            <>
              <NavLink to="/donor/dashboard" className={navLinkClassName}>
                My Dashboard
              </NavLink>
              <NavLink to="/donor/profile" className={navLinkClassName}>
                My Profile
              </NavLink>
            </>
          )}
          {user?.role === 'COORDINATOR' && (
            <NavLink to="/coordinator/requests" className={navLinkClassName}>
              Manage Requests
            </NavLink>
          )}
        </nav>

        <div className="layout-navbar__actions">
          {!user && (
            <>
              <Link to="/sign-in" className={buttonClassName({ variant: 'secondary', size: 'sm' })}>
                Sign In
              </Link>
              <Link to="/sign-up" className={buttonClassName({ variant: 'primary', size: 'sm' })}>
                Become a Donor
              </Link>
            </>
          )}

          {user?.role === 'DONOR' && user.donorProfile && (
            <div className="layout-navbar__user">
              <BloodTypeBadge bloodType={user.donorProfile.bloodType} />
              <span className="layout-navbar__user-text">
                <span className="layout-navbar__user-name">{user.donorProfile.fullName}</span>
                <span className="layout-navbar__user-role layout-navbar__user-role--donor">Donor</span>
              </span>
            </div>
          )}

          {user?.role === 'COORDINATOR' && (
            <div className="layout-navbar__user">
              <span className="layout-navbar__user-text">
                <span className="layout-navbar__user-name">Coordinator</span>
                <span className="layout-navbar__user-role layout-navbar__user-role--coordinator" dir="ltr">
                  {user.email ?? user.phone}
                </span>
              </span>
            </div>
          )}

          {user && (
            <button
              type="button"
              className="layout-navbar__sign-out"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
