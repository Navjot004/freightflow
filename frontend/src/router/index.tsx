import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import LoginPage from '../modules/auth/pages/LoginPage';
import SignupPage from '../modules/auth/pages/SignupPage';
import ForgotPasswordPage from '../modules/auth/pages/ForgotPasswordPage';
import ForceChangePasswordPage from '../modules/auth/pages/ForceChangePasswordPage';
import CompanyDashboardPage from '../modules/company/pages/CompanyDashboardPage';
import CompanySettingsPage from '../modules/company/pages/CompanySettingsPage';
import AcceptInvitePage from '../modules/company/pages/AcceptInvitePage';
import MarketplacePage from '../modules/company/pages/MarketplacePage';
import LoadCreationPage from '../modules/loads/pages/LoadCreationPage';
import MyLoadsPage from '../modules/loads/pages/MyLoadsPage';
import LoadDetailsPage from '../modules/loads/pages/LoadDetailsPage';
import MyBidsPage from '../modules/bids/pages/MyBidsPage';
import MyTendersPage from '../modules/tenders/pages/MyTendersPage';
import MyShipmentsPage from '../modules/shipments/pages/MyShipmentsPage';
import ShipmentExecutionPage from '../modules/shipments/pages/ShipmentExecutionPage';
import AssignmentRequestsPage from '../modules/partner_assignments/pages/AssignmentRequestsPage';
import PartnershipHubPage from '../modules/partnerships/pages/PartnershipHubPage';
import DriverListPage from '../modules/drivers/pages/DriverListPage';
import DriverDashboardPage from '../modules/driver/pages/DriverDashboardPage';
import AdminDashboard from '../modules/admin/pages/AdminDashboard';
import CompanyVerification from '../modules/admin/pages/CompanyVerification';
import UserManagement from '../modules/admin/pages/UserManagement';
import AuditLogs from '../modules/admin/pages/AuditLogs';
import DisputesManagement from '../modules/admin/pages/DisputesManagement';
import MyVehiclePage from '../modules/owner_operator/pages/MyVehiclePage';
import UserProfilePage from '../modules/profile/pages/UserProfilePage';
import InvoicesPage from '../modules/finance/pages/InvoicesPage';
import DashboardLayout from '../components/layout/DashboardLayout';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import NotFoundPage from '../pages/NotFoundPage';

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
    return <DriverDashboardPage />;
  }
  if (user?.role?.name === 'SUPER_ADMIN') {
    return <Navigate to="/admin/analytics" replace />;
  }
  return <CompanyDashboardPage />;
};

export const router = createBrowserRouter([
  {
    element: <ErrorBoundary><Outlet /></ErrorBoundary>,
    children: [
      {
        element: <PublicRoute />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/signup', element: <SignupPage /> },
          { path: '/forgot-password', element: <ForgotPasswordPage /> },
          { path: '/invite/accept', element: <AcceptInvitePage /> },
          { path: '/', element: <Navigate to="/login" replace /> },
        ]
      },
      {
        path: '/force-change-password',
        element: (
          <ErrorBoundary>
            <ForceChangePasswordPage />
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
              { path: '/settings', element: <CompanySettingsPage /> },
              { path: '/profile', element: <UserProfilePage /> },
              { path: '/marketplace', element: <MarketplacePage /> },
              { path: '/loads/create', element: <LoadCreationPage /> },
              { path: '/loads/my-loads', element: <MyLoadsPage /> },
              { path: '/loads/:id', element: <LoadDetailsPage /> },
              { path: '/bids/my-bids', element: <MyBidsPage /> },
              { path: '/tenders/my-tenders', element: <MyTendersPage /> },
              { path: '/assignments/requests', element: <AssignmentRequestsPage /> },
              { path: '/owner-operator/vehicle', element: <MyVehiclePage /> },
              { path: '/shipments/my-shipments', element: <MyShipmentsPage /> },
              { path: '/shipments/execute/:id', element: <ShipmentExecutionPage /> },
              { path: '/finance/invoices', element: <InvoicesPage /> },
              { path: '/drivers/manage', element: <DriverListPage /> },
              { path: '/driver/dashboard', element: <DriverDashboardPage /> },
              { path: '/partnerships', element: <PartnershipHubPage /> },
              { path: '/disputes/manage', element: <DisputesManagement /> },
              { path: '/admin/analytics', element: <AdminDashboard /> },
              { path: '/admin/companies', element: <CompanyVerification /> },
              { path: '/admin/users', element: <UserManagement /> },
              { path: '/admin/audit', element: <AuditLogs /> },
            ]
          }
        ]
      },
      { path: '*', element: <NotFoundPage /> }
    ]
  }
]);
