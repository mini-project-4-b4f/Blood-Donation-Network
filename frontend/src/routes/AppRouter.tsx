import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import SignInPage from '../pages/SignIn/SignInPage';
import SignUpPage from '../pages/SignUp/SignUpPage';

function Placeholder({ title }: { title: string }) {
  return <section className="layout-prompt"><h1>{title}</h1><p>This workspace is coming soon.</p></section>;
}

export default function AppRouter() {
  return <BrowserRouter><Routes><Route element={<Layout />}>
    <Route path="/" element={<Placeholder title="Public SOS Board" />} />
    <Route path="/sign-in" element={<SignInPage />} />
    <Route path="/sign-up" element={<SignUpPage />} />
    <Route element={<ProtectedRoute role="DONOR" />}>
      <Route path="/donor/dashboard" element={<Placeholder title="My Dashboard" />} />
      <Route path="/donor/profile" element={<Placeholder title="My Profile" />} />
    </Route>
    <Route element={<ProtectedRoute role="COORDINATOR" />}>
      <Route path="/coordinator/requests" element={<Placeholder title="Manage Requests" />} />
      <Route path="/coordinator/requests/:requestId" element={<Placeholder title="Request Details" />} />
      <Route path="/coordinator/requests/:requestId/eligible-donors" element={<Placeholder title="Eligible Donors" />} />
    </Route>
    <Route path="*" element={<Placeholder title="Page Not Found" />} />
  </Route></Routes></BrowserRouter>;
}
