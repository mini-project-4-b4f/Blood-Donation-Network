import {type ReactNode } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types/auth.types';
import { buttonClassName } from '../common/Button';
import { ErrorMessage } from '../common/ErrorMessage';
import { Icon, IconName } from '../common/Icon';
import { Loading } from '../common/Loading';
import './ProtectedRoute.css';

interface ProtectedRouteProps {
  /** Only users with this role may open the routes nested inside. */
  role: Role;
}

interface NoticeProps {
  icon: IconName;
  tone: 'locked' | 'denied';
  title: string;
  text: string;
  children: ReactNode;
}

function Notice({ icon, tone, title, text, children }: NoticeProps) {
  return (
    <div className="layout-protected" role="alert">
      <span className={`layout-protected__icon layout-protected__icon--${tone}`}>
        <Icon name={icon} size={28} />
      </span>
      <h2 className="layout-protected__title">{title}</h2>
      <p className="layout-protected__text">{text}</p>
      <div className="layout-protected__actions">{children}</div>
    </div>
  );
}

export function ProtectedRoute({ role }: ProtectedRouteProps) {
  const { user, token, isAuthLoading, authError, loadCurrentUser } = useAuth();

  // The saved token is being checked: never flash the sign-in prompt at a signed-in user.
  if (isAuthLoading) return <Loading message="جاري التحقق من الجلسة..." />;

  // A token is stored but the check failed (e.g. the server is unreachable): offer a retry.
  if (!user && token && authError) {
    return <ErrorMessage message={authError} onRetry={() => void loadCurrentUser()} />;
  }

  if (!user) {
    return (
      <Notice
        icon="lock"
        tone="locked"
        title="تسجيل الدخول مطلوب"
        text="يجب تسجيل الدخول كمتبرع أو منسق بنك دم للوصول إلى هذه الشاشة الآمنة."
      >
        <Link to="/sign-in" className={buttonClassName({ size: 'lg', className: 'layout-protected__button' })}>
          تسجيل الدخول الآن
        </Link>
        <Link
          to="/sign-up"
          className={buttonClassName({ variant: 'outline', size: 'lg', className: 'layout-protected__button' })}
        >
          إنشاء حساب متبرع جديد
        </Link>
      </Notice>
    );
  }

  if (user.role !== role) {
    const ownHome = user.role === 'COORDINATOR' ? '/coordinator/requests' : '/donor/dashboard';
    const ownHomeLabel = user.role === 'COORDINATOR' ? 'الذهاب إلى إدارة الطلبات' : 'الذهاب إلى لوحة التحكم';
    const text =
      role === 'COORDINATOR'
        ? 'هذه الشاشة مخصصة لمنسقي بنوك الدم والمستشفيات فقط.'
        : 'هذه الشاشة مخصصة للمتبرعين المسجلين فقط.';
    return (
      <Notice icon="triangle-alert" tone="denied" title="صلاحية الوصول مرفوضة" text={text}>
        <Link to={ownHome} className={buttonClassName({ variant: 'secondary', size: 'lg' })}>
          {ownHomeLabel}
        </Link>
      </Notice>
    );
  }

  return <Outlet />;
}
