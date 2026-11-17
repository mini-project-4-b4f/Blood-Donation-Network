import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import BloodTypeBadge from '../common/BloodTypeBadge';
import { buttonClassName } from '../common/Button';
import './Navbar.css';

function navLinkClassName({ isActive }: { isActive: boolean }): string {
  return isActive ? 'layout-navbar__link layout-navbar__link--active' : 'layout-navbar__link';
}

export function Navbar() {
  const { user, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
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

        <nav className="layout-navbar__nav" aria-label={t('Main navigation')}>
          <NavLink to="/" end className={navLinkClassName}>{t('SOS Board')}</NavLink>
          {user?.role === 'DONOR' && (
            <>
              <NavLink to="/donor/dashboard" className={navLinkClassName}>{t('My Dashboard')}</NavLink>
              <NavLink to="/donor/profile" className={navLinkClassName}>{t('My Profile')}</NavLink>
            </>
          )}
          {user?.role === 'COORDINATOR' && (
            <NavLink to="/coordinator/requests" className={navLinkClassName}>{t('Manage Requests')}</NavLink>
          )}
        </nav>

        <div className="layout-navbar__actions">
          <button
            type="button"
            className="layout-navbar__language"
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            aria-label={language === 'en' ? 'Switch language to Arabic' : 'Switch language to English'}
            lang={language === 'en' ? 'ar' : 'en'}
          >
            {language === 'en' ? 'العربية' : 'English'}
          </button>
          {!user && (
            <>
              <Link to="/sign-in" className={buttonClassName({ variant: 'secondary', size: 'sm' })}>{t('Sign In')}</Link>
              <Link to="/sign-up" className={buttonClassName({ variant: 'primary', size: 'sm' })}>{t('Become a Donor')}</Link>
            </>
          )}
          {user?.role === 'DONOR' && user.donorProfile && (
            <div className="layout-navbar__user">
              <BloodTypeBadge bloodType={user.donorProfile.bloodType} />
              <span className="layout-navbar__user-text">
                <span className="layout-navbar__user-name">{user.donorProfile.fullName}</span>
                <span className="layout-navbar__user-role layout-navbar__user-role--donor">{t('Donor')}</span>
              </span>
            </div>
          )}
          {user?.role === 'COORDINATOR' && (
            <div className="layout-navbar__user">
              <span className="layout-navbar__user-text">
                <span className="layout-navbar__user-name">{t('Coordinator')}</span>
                <span className="layout-navbar__user-role layout-navbar__user-role--coordinator" dir="ltr">{user.email ?? user.phone}</span>
              </span>
            </div>
          )}
          {user && <button type="button" className="layout-navbar__sign-out" onClick={handleSignOut}>{t('Sign Out')}</button>}
        </div>
      </div>
    </header>
  );
}
