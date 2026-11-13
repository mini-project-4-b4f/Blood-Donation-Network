import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { ProtectedRoute } from '../components/layout/ProtectedRoute.tsx';
import { DonorDashboardPage } from '../pages/DonorDashboard/DonorDashboardPage';
import { DonorProfilePage } from '../pages/DonorProfile/DonorProfilePage';
import { EligibleDonorsPage } from '../pages/EligibleDonors/EligibleDonorsPage';
import { NotFoundPage } from '../pages/NotFound/NotFoundPage';
import { RequestDetailsPage } from '../pages/RequestDetails/RequestDetailsPage';
import { RequestsPage } from '../pages/Requests/RequestsPage';
import { SignInPage } from '../pages/SignIn/SignInPage';
import { SignUpPage } from '../pages/SignUp/SignUpPage';
import { SosBoardPage } from '../pages/SosBoard/SosBoardPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* Public */}
          <Route path="/" element={<SosBoardPage />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />

          {/* Donor only */}
          <Route element={<ProtectedRoute role="DONOR" />}>
            <Route path="/donor/dashboard" element={<DonorDashboardPage />} />
            <Route path="/donor/profile" element={<DonorProfilePage />} />
          </Route>

          {/* Coordinator only */}
          <Route element={<ProtectedRoute role="COORDINATOR" />}>
            <Route path="/coordinator/requests" element={<RequestsPage />} />
            <Route path="/coordinator/requests/:requestId" element={<RequestDetailsPage />} />
            <Route
              path="/coordinator/requests/:requestId/eligible-donors"
              element={<EligibleDonorsPage />}
            />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
