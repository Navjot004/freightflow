import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import React, { Suspense } from 'react';

// --- Lazy-loaded page components for code-splitting ---
const LandingPage = React.lazy(() => import('../modules/landing/pages/LandingPage'));
const LoginPage = React.lazy(() => import('../modules/auth/pages/LoginPage'));
const SignupPage = React.lazy(() => import('../modules/auth/pages/SignupPage'));
const ForgotPasswordPage = React.lazy(() => import('../modules/auth/pages/ForgotPasswordPage'));
const ForceChangePasswordPage = React.lazy(() => import('../modules/auth/pages/ForceChangePasswordPage'));
const CompanyDashboardPage = React.lazy(() => import('../modules/company/pages/CompanyDashboardPage'));
const CompanySettingsPage = React.lazy(() => import('../modules/company/pages/CompanySettingsPage'));
const AcceptInvitePage = React.lazy(() => import('../modules/company/pages/AcceptInvitePage'));
const MarketplacePage = React.lazy(() => import('../modules/company/pages/MarketplacePage'));
const LoadCreationPage = React.lazy(() => import('../modules/loads/pages/LoadCreationPage'));
const MyLoadsPage = React.lazy(() => import('../modules/loads/pages/MyLoadsPage'));
const LoadDetailsPage = React.lazy(() => import('../modules/loads/pages/LoadDetailsPage'));
const MyBidsPage = React.lazy(() => import('../modules/bids/pages/MyBidsPage'));
const MyTendersPage = React.lazy(() => import('../modules/tenders/pages/MyTendersPage'));
const MyShipmentsPage = React.lazy(() => import('../modules/shipments/pages/MyShipmentsPage'));
const ShipmentExecutionPage = React.lazy(() => import('../modules/shipments/pages/ShipmentExecutionPage'));
const AssignmentRequestsPage = React.lazy(() => import('../modules/partner_assignments/pages/AssignmentRequestsPage'));
const PartnershipHubPage = React.lazy(() => import('../modules/partnerships/pages/PartnershipHubPage'));
const DriverListPage = React.lazy(() => import('../modules/drivers/pages/DriverListPage'));
const DriverDashboardPage = React.lazy(() => import('../modules/driver/pages/DriverDashboardPage'));
const AdminDashboard = React.lazy(() => import('../modules/admin/pages/AdminDashboard'));
const CompanyVerification = React.lazy(() => import('../modules/admin/pages/CompanyVerification'));
const UserManagement = React.lazy(() => import('../modules/admin/pages/UserManagement'));
const AuditLogs = React.lazy(() => import('../modules/admin/pages/AuditLogs'));
const DisputesManagement = React.lazy(() => import('../modules/admin/pages/DisputesManagement'));
const MyVehiclePage = React.lazy(() => import('../modules/owner_operator/pages/MyVehiclePage'));
const UserProfilePage = React.lazy(() => import('../modules/profile/pages/UserProfilePage'));
const InvoicesPage = React.lazy(() => import('../modules/finance/pages/InvoicesPage'));

// DashboardLayout is NOT lazy-loaded — it's the shell that wraps all protected pages.
import DashboardLayout from '../components/layout/DashboardLayout';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import NotFoundPage from '../pages/NotFoundPage';

// --- Suspense loading fallback ---
const PageLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100%',
    background: 'var(--background, #0a0a0a)',
  }}>
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(255,255,255,0.1)',
        borderTopColor: '#3b82f6',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 500 }}>Loading...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  </div>
);

// --- Suspense wrapper helper ---
const Lazy = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

const ProtectedRoute = () => {
  const token = useAuthStore(state => state.token);
  const user = useAuthStore(state => state.user);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.requires_password_change) {
    return <Navigate to="/force-change-password" replace />;
  }
  
  return <Outlet />;
};

const PublicRoute = () => {
  const token = useAuthStore(state => state.token);
  const user = useAuthStore(state => state.user);
  if (token) {
    if (user?.role?.name === 'DRIVER') {
      return <Navigate to="/driver/dashboard" replace />;
    }
    if (user?.role?.name === 'SUPER_ADMIN') {
      return <Navigate to="/admin/analytics" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
};

const DashboardDispatcher = () => {
  const user = useAuthStore(state => state.user);
  if (user?.role?.name === 'DRIVER') {
    return <Lazy><DriverDashboardPage /></Lazy>;
  }
  if (user?.role?.name === 'SUPER_ADMIN') {
    return <Navigate to="/admin/analytics" replace />;
  }
  return <Lazy><CompanyDashboardPage /></Lazy>;
};

export const router = createBrowserRouter([
  {
    element: <ErrorBoundary><Outlet /></ErrorBoundary>,
    children: [
      { path: '/', element: <Lazy><LandingPage /></Lazy> },
      {
        element: <PublicRoute />,
        children: [
          { path: '/login', element: <Lazy><LoginPage /></Lazy> },
          { path: '/signup', element: <Lazy><SignupPage /></Lazy> },
          { path: '/forgot-password', element: <Lazy><ForgotPasswordPage /></Lazy> },
          { path: '/invite/accept', element: <Lazy><AcceptInvitePage /></Lazy> },
        ]
      },
      {
        path: '/force-change-password',
        element: (
          <ErrorBoundary>
            <Lazy><ForceChangePasswordPage /></Lazy>
          </ErrorBoundary>
        )
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              { path: '/dashboard', element: <DashboardDispatcher /> },
              { path: '/settings', element: <Lazy><CompanySettingsPage /></Lazy> },
              { path: '/profile', element: <Lazy><UserProfilePage /></Lazy> },
              { path: '/marketplace', element: <Lazy><MarketplacePage /></Lazy> },
              { path: '/loads/create', element: <Lazy><LoadCreationPage /></Lazy> },
              { path: '/loads/my-loads', element: <Lazy><MyLoadsPage /></Lazy> },
              { path: '/loads/:id', element: <Lazy><LoadDetailsPage /></Lazy> },
              { path: '/bids/my-bids', element: <Lazy><MyBidsPage /></Lazy> },
              { path: '/tenders/my-tenders', element: <Lazy><MyTendersPage /></Lazy> },
              { path: '/assignments/requests', element: <Lazy><AssignmentRequestsPage /></Lazy> },
              { path: '/owner-operator/vehicle', element: <Lazy><MyVehiclePage /></Lazy> },
              { path: '/shipments/my-shipments', element: <Lazy><MyShipmentsPage /></Lazy> },
              { path: '/shipments/execute/:id', element: <Lazy><ShipmentExecutionPage /></Lazy> },
              { path: '/finance/invoices', element: <Lazy><InvoicesPage /></Lazy> },
              { path: '/drivers/manage', element: <Lazy><DriverListPage /></Lazy> },
              { path: '/driver/dashboard', element: <Lazy><DriverDashboardPage /></Lazy> },
              { path: '/partnerships', element: <Lazy><PartnershipHubPage /></Lazy> },
              { path: '/disputes/manage', element: <Lazy><DisputesManagement /></Lazy> },
              { path: '/admin/analytics', element: <Lazy><AdminDashboard /></Lazy> },
              { path: '/admin/companies', element: <Lazy><CompanyVerification /></Lazy> },
              { path: '/admin/users', element: <Lazy><UserManagement /></Lazy> },
              { path: '/admin/audit', element: <Lazy><AuditLogs /></Lazy> },
            ]
          }
        ]
      },
      { path: '*', element: <NotFoundPage /> }
    ]
  }
]);

