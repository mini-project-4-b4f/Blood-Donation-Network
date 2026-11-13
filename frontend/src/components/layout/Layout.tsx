import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Icon } from '../common/Icon';
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
        تخطي إلى المحتوى
      </a>
      <Navbar />
      <main className="layout-shell__main" id="main-content">
        <Outlet />
      </main>
      <footer className="layout-footer">
        <div className="layout-footer__inner">
          <p className="layout-footer__brand">
            <Icon name="heart" size={18} className="layout-footer__brand-icon" />
            منصة تنسيق التبرع بالدم في الحالات الطارئة
          </p>
          <p className="layout-footer__note">
            هذه المنصة مخصصة لسرعة التنسيق وتوجيه المتبرعين المؤهلين في نفس المنطقة. لا تغني عن الفحوصات
            المخبرية الطبية الرسمية.
          </p>
        </div>
      </footer>
    </div>
  );
}
