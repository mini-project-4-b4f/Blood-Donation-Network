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
import { RequestsPage } from '../pages/Requests/RequestsPage';
import { RequestDetailsPage } from '../pages/RequestDetails/RequestDetailsPage';
import { EligibleDonorsPage } from '../pages/EligibleDonors/EligibleDonorsPage';
import '../components/layout/ProtectedRoute.css';

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
            <Route path="/coordinator/requests" element={<RequestsPage />} />
            <Route path="/coordinator/requests/:requestId" element={<RequestDetailsPage />} />
            <Route path="/coordinator/requests/:requestId/eligible-donors" element={<EligibleDonorsPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
