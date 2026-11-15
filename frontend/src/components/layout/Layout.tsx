import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import './Layout.css';

export function Layout() {
  const { pathname } = useLocation();

  // A new page always opens at its top.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="layout-shell">
      <a className="layout-shell__skip-link" href="#main-content">
        Skip to content
      </a>
      <Navbar />
      <main className="layout-shell__main" id="main-content">
        <Outlet />
      </main>
      <footer className="layout-footer">
        <div className="layout-footer__inner">
          <p className="layout-footer__brand">
            <span className="layout-footer__brand-icon" aria-hidden="true">♥</span>
            Connecting volunteer donors with hospitals that need them.
          </p>
          <p className="layout-footer__note">
            Donation eligibility is confirmed by qualified healthcare staff before every donation.
          </p>
        </div>
      </footer>
    </div>
  );
}
