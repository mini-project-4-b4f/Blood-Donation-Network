import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BloodTypeBadge } from '../common/BloodTypeBadge';
import { buttonClassName } from '../common/Button';
import { Icon } from '../common/Icon';
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
          <span className="layout-navbar__logo">
            <Icon name="droplet" size={24} />
          </span>
          <span className="layout-navbar__brand-text">
            <span className="layout-navbar__title">شبكة تنسيق التبرع بالدم</span>
            <span className="layout-navbar__subtitle">Blood Donation Network (حالات طارئة SOS)</span>
          </span>
        </Link>

        <nav className="layout-navbar__nav" aria-label="القائمة الرئيسية">
          <NavLink to="/" end className={navLinkClassName}>
            لوحة الاستغاثة (SOS)
          </NavLink>
          {user?.role === 'DONOR' && (
            <>
              <NavLink to="/donor/dashboard" className={navLinkClassName}>
                لوحة تحكم المتبرع
              </NavLink>
              <NavLink to="/donor/profile" className={navLinkClassName}>
                الملف الشخصي
              </NavLink>
            </>
          )}
          {user?.role === 'COORDINATOR' && (
            <NavLink to="/coordinator/requests" className={navLinkClassName}>
              إدارة الطلبات والنداءات
            </NavLink>
          )}
          {!user && (
            <NavLink to="/sign-in" className={navLinkClassName}>
              دخول المنسقين / المتبرعين
            </NavLink>
          )}
        </nav>

        <div className="layout-navbar__actions">
          {!user && (
            <>
              <Link to="/sign-in" className={buttonClassName({ variant: 'secondary', size: 'sm' })}>
                تسجيل الدخول
              </Link>
              <Link to="/sign-up" className={buttonClassName({ variant: 'primary', size: 'sm' })}>
                انضم كمتبرع
              </Link>
            </>
          )}

          {user?.role === 'DONOR' && user.donorProfile && (
            <div className="layout-navbar__user">
              <BloodTypeBadge bloodType={user.donorProfile.bloodType} size="sm" />
              <span className="layout-navbar__user-text">
                <span className="layout-navbar__user-name">{user.donorProfile.fullName}</span>
                <span className="layout-navbar__user-role layout-navbar__user-role--donor">متبرع</span>
              </span>
            </div>
          )}

          {user?.role === 'COORDINATOR' && (
            <div className="layout-navbar__user">
              <span className="layout-navbar__user-icon">
                <Icon name="shield-check" size={22} />
              </span>
              <span className="layout-navbar__user-text">
                <span className="layout-navbar__user-name">منسق بنك الدم</span>
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
              aria-label="تسجيل الخروج"
              title="تسجيل الخروج"
            >
              <Icon name="log-out" size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
