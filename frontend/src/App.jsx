import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Contexts
import { useAuth }         from './context/AuthContext'
import { useSuperAdmin }   from './context/SuperAdminContext'
import { useTenantPortal } from './context/TenantPortalContext'
import { useOwnerPortal }  from './context/OwnerPortalContext'
import { AppProviders }    from './context/AppProviders'

// UI
import { FullPageLoader } from './components/ui/Spinner'

// Pages agence
import LoginPage      from './pages/auth/LoginPage'
import RegisterPage   from './pages/auth/RegisterPage'
import DashboardPage  from './pages/dashboard/DashboardPage'
import PropertiesPage from './pages/properties/PropertiesPage'
import OwnersPage     from './pages/owners/OwnersPage'
import TenantsPage    from './pages/tenants/TenantsPage'
import ContractsPage  from './pages/contracts/ContractsPage'
import PaymentsPage   from './pages/payments/PaymentsPage'
import UsersPage      from './pages/users/UsersPage'
import ProfilePage    from './pages/agency/ProfilePage'
import BillingPage    from './pages/agency/BillingPage'
import ExpensesPage   from './pages/expenses/ExpensesPage'
import PaymentConfirmPage from './pages/payments/PaymentConfirmPage'

// Pages super admin
import SuperAdminLogin     from './pages/super/SuperAdminLogin'
import SuperAdminDashboard from './pages/super/SuperAdminDashboard'
import AgenciesPage        from './pages/super/AgenciesPage'
import LogsPage            from './pages/super/LogsPage'
import BillingAdminPage    from './pages/super/BillingAdminPage'

// Portail locataire
import TenantLoginPage     from './pages/tenant/TenantLoginPage'
import TenantDashboardPage from './pages/tenant/TenantDashboardPage'

// Portail propriétaire
import OwnerLoginPage     from './pages/owner/OwnerLoginPage'
import OwnerDashboardPage from './pages/owner/OwnerDashboardPage'

// Portail caissier
import CashPage from './pages/cash/CashPage'

// ── Guards de routes ─────────────────────────────────────────

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullPageLoader />
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullPageLoader />
  return !user ? children : <Navigate to="/dashboard" replace />
}

function SuperPrivateRoute({ children }) {
  const { superAdmin, loading } = useSuperAdmin()
  if (loading) return <FullPageLoader />
  return superAdmin ? children : <Navigate to="/super/login" replace />
}

function SuperPublicRoute({ children }) {
  const { superAdmin, loading } = useSuperAdmin()
  if (loading) return <FullPageLoader />
  return !superAdmin ? children : <Navigate to="/super/dashboard" replace />
}

function TenantPrivateRoute({ children }) {
  const { tenant, loading } = useTenantPortal()
  if (loading) return <FullPageLoader />
  return tenant ? children : <Navigate to="/tenant/login" replace />
}

function TenantPublicRoute({ children }) {
  const { tenant, loading } = useTenantPortal()
  if (loading) return <FullPageLoader />
  return !tenant ? children : <Navigate to="/tenant/dashboard" replace />
}

function OwnerPrivateRoute({ children }) {
  const { owner, loading } = useOwnerPortal()
  if (loading) return <FullPageLoader />
  return owner ? children : <Navigate to="/owner/login" replace />
}

function OwnerPublicRoute({ children }) {
  const { owner, loading } = useOwnerPortal()
  if (loading) return <FullPageLoader />
  return !owner ? children : <Navigate to="/owner/dashboard" replace />
}

// ── Routes ───────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Routes>
      {/* Auth agence */}
      <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* App agence */}
      <Route path="/dashboard"  element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/properties" element={<PrivateRoute><PropertiesPage /></PrivateRoute>} />
      <Route path="/owners"     element={<PrivateRoute><OwnersPage /></PrivateRoute>} />
      <Route path="/tenants"    element={<PrivateRoute><TenantsPage /></PrivateRoute>} />
      <Route path="/contracts"  element={<PrivateRoute><ContractsPage /></PrivateRoute>} />
      <Route path="/payments"   element={<PrivateRoute><PaymentsPage /></PrivateRoute>} />
      <Route path="/users"      element={<PrivateRoute><UsersPage /></PrivateRoute>} />
      <Route path="/profile"    element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
      <Route path="/billing"    element={<PrivateRoute><BillingPage /></PrivateRoute>} />
      <Route path="/expenses"   element={<PrivateRoute><ExpensesPage /></PrivateRoute>} />
      <Route path="/cash"       element={<PrivateRoute><CashPage /></PrivateRoute>} />

      {/* Paiement en ligne — public (retour CinetPay) */}
      <Route path="/payments/confirm" element={<PaymentConfirmPage />} />

      {/* Super Admin */}
      <Route path="/super/login"
        element={<SuperPublicRoute><SuperAdminLogin /></SuperPublicRoute>} />
      <Route path="/super/dashboard"
        element={<SuperPrivateRoute><SuperAdminDashboard /></SuperPrivateRoute>} />
      <Route path="/super/agencies"
        element={<SuperPrivateRoute><AgenciesPage /></SuperPrivateRoute>} />
      <Route path="/super/logs"
        element={<SuperPrivateRoute><LogsPage /></SuperPrivateRoute>} />
      <Route path="/super/billing"
        element={<SuperPrivateRoute><BillingAdminPage /></SuperPrivateRoute>} />

      {/* Portail Locataire */}
      <Route path="/tenant/login"
        element={<TenantPublicRoute><TenantLoginPage /></TenantPublicRoute>} />
      <Route path="/tenant/dashboard"
        element={<TenantPrivateRoute><TenantDashboardPage /></TenantPrivateRoute>} />
      <Route path="/tenant"
        element={<Navigate to="/tenant/dashboard" replace />} />

      {/* Portail Propriétaire */}
      <Route path="/owner/login"
        element={<OwnerPublicRoute><OwnerLoginPage /></OwnerPublicRoute>} />
      <Route path="/owner/dashboard"
        element={<OwnerPrivateRoute><OwnerDashboardPage /></OwnerPrivateRoute>} />
      <Route path="/owner"
        element={<Navigate to="/owner/dashboard" replace />} />

      {/* Redirections */}
      <Route path="/"      element={<Navigate to="/dashboard" replace />} />
      <Route path="/super" element={<Navigate to="/super/dashboard" replace />} />
      <Route path="*"      element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

// ── App root ─────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </BrowserRouter>
  )
}