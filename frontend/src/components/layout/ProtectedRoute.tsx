import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { Role } from '../../types/auth.types';
import ErrorMessage from '../common/ErrorMessage';
import Loading from '../common/Loading';

export default function ProtectedRoute({ role }: { role: Role }) {
  const { user, token, isAuthLoading, authError, loadCurrentUser } = useAuth();
  if (isAuthLoading) return <Loading message="Checking your session…" />;
  if (!user) return (
    <section className="layout-prompt">
      <h1>Sign-In Required</h1>
      <p>Sign in to open your workspace.</p>
      {token && authError && <ErrorMessage message={authError} onRetry={() => void loadCurrentUser()} />}
      <Link to="/sign-in">Go to Sign In</Link>
    </section>
  );
  if (user.role !== role) return <section className="layout-prompt"><h1>Access Restricted</h1><p>This workspace is for a different account role.</p><Link to={user.role === 'DONOR' ? '/donor/dashboard' : '/coordinator/requests'}>Go to my workspace</Link></section>;
  return <Outlet />;
}
