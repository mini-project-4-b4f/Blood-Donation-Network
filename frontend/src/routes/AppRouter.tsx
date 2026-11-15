import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import { DonorProvider } from '../context/DonorContext';
import { DonorDashboardPage } from '../pages/DonorDashboard/DonorDashboardPage';
import { DonorProfilePage } from '../pages/DonorProfile/DonorProfilePage';
import SignInPage from '../pages/SignIn/SignInPage';
import SignUpPage from '../pages/SignUp/SignUpPage';
import SosBoardPage from '../pages/SosBoard/SosBoardPage';
import NotFoundPage from '../pages/NotFound/NotFoundPage';
import '../components/layout/ProtectedRoute.css';

function Placeholder({ title }: { title: string }) {
  return <section className="layout-protected"><h1>{title}</h1><p>This workspace is coming soon.</p></section>;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<SosBoardPage />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />

          <Route element={<ProtectedRoute role="DONOR" />}>
            {/* Start donor API calls only after the donor session is confirmed. */}
            <Route element={<DonorProvider><Outlet /></DonorProvider>}>
              <Route path="/donor/dashboard" element={<DonorDashboardPage />} />
              <Route path="/donor/profile" element={<DonorProfilePage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute role="COORDINATOR" />}>
            <Route path="/coordinator/requests" element={<Placeholder title="Manage Requests" />} />
            <Route path="/coordinator/requests/:requestId" element={<Placeholder title="Request Details" />} />
            <Route path="/coordinator/requests/:requestId/eligible-donors" element={<Placeholder title="Eligible Donors" />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
