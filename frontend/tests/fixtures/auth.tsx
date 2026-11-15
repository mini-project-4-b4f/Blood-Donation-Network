import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, useAuth } from '../../src/context/AuthContext';

export default function Harness() {
  const auth = useAuth();
  return <>
    <p data-testid="user">{auth.user?.role ?? 'none'}</p>
    <p data-testid="loading">{String(auth.isAuthLoading)}</p>
    <p data-testid="areas-loading">{String(auth.isAreasLoading)}</p>
    <p data-testid="areas">{auth.areas.length}</p>
    <p data-testid="error">{auth.authError}</p>
    <button onClick={() => void auth.signIn({ identifier: '0933112233', password: 'Password123' })}>Sign in</button>
    <button onClick={() => void auth.signUp({ fullName: 'Test Donor', phone: '0933112233', password: 'Password123', bloodType: 'A-', areaId: 'area-homs' })}>Register</button>
    <button onClick={auth.signOut}>Sign out</button>
    <button onClick={() => void auth.loadCurrentUser()}>Restore</button>
    <button onClick={() => void auth.loadAreas()}>Load areas</button>
    <button onClick={auth.clearAuthError}>Clear error</button>
  </>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><AuthProvider><Harness /></AuthProvider></StrictMode>);
