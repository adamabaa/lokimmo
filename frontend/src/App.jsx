import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Contexts
import { useAuth }         from './context/AuthContext'
import { useSuperAdmin }   from './context/SuperAdminContext'
import { useTenantPortal } from './context/TenantPortalContext'
import { useOwnerPortal }  from './context/OwnerPortalContext'
import { AppProviders }    from './context/AppProviders'

// UI — chargé immédiatement car utilisé par tous les guards
import { FullPageLoader } from './components/ui/Spinner'

// ── Lazy imports — chaque page chargée uniquement quand visitée ──

// Pages agence
const LoginPage           = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage        = lazy(() => import('./pages/auth/RegisterPage'))
const DashboardPage       = lazy(() => import('./pages/dashboard/DashboardPage'))
const PropertiesPage      = lazy(() => import('./pages/properties/PropertiesPage'))
const OwnersPage          = lazy(() => import('./pages/owners/OwnersPage'))
const TenantsPage         = lazy(() => import('./pages/tenants/TenantsPage'))
const ContractsPage       = lazy(() => import('./pages/contracts/ContractsPage'))
const PaymentsPage        = lazy(() => import('./pages/payments/PaymentsPage'))
const UsersPage           = lazy(() => import('./pages/users/UsersPage'))
const ProfilePage         = lazy(() => import('./pages/agency/ProfilePage'))
const BillingPage         = lazy(() => import('./pages/agency/BillingPage'))
const ExpensesPage        = lazy(() => import('./pages/expenses/ExpensesPage'))
const PaymentConfirmPage  = lazy(() => import('./pages/payments/PaymentConfirmPage'))
const CashPage            = lazy(() => import('./pages/cash/CashPage'))

// Pages super admin
// Groupées ensemble — un admin qui visite /super/dashboard
// chargera probablement aussi agencies, logs, billing
const SuperAdminLogin     = lazy(() => import('./pages/super/SuperAdminLogin'))
const SuperAdminDashboard = lazy(() => import('./pages/super/SuperAdminDashboard'))
const AgenciesPage        = lazy(() => import('./pages/super/AgenciesPage'))
const LogsPage            = lazy(() => import('./pages/super/LogsPage'))
const BillingAdminPage    = lazy(() => import('./pages/super/BillingAdminPage'))

// Portails — complètement séparés du SaaS principal
const TenantLoginPage     = lazy(() => import('./pages/tenant/TenantLoginPage'))
const TenantDashboardPage = lazy(() => import('./pages/tenant/TenantDashboardPage'))
const OwnerLoginPage      = lazy(() => import('./pages/owner/OwnerLoginPage'))
const OwnerDashboardPage  = lazy(() => import('./pages/owner/OwnerDashboardPage'))

// ── Guards de routes ─────────────────────────────────────────
// Inchangés — pas de lazy ici car utilisés sur chaque navigation

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
    // Suspense intercepte le chargement lazy de chaque page
    // FullPageLoader s'affiche pendant le téléchargement du chunk
    <Suspense fallback={<FullPageLoader />}>
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
    </Suspense>
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