import { AuthProvider }         from './AuthProvider'
import { ToastProvider }        from './ToastProvider'
import { SuperAdminProvider }   from './SuperAdminProvider'
import { NotificationProvider } from './NotificationProvider'
import { TenantPortalProvider } from './TenantPortalProvider'
import { OwnerPortalProvider }  from './OwnerPortalProvider'

export function AppProviders({ children }) {
  return (
    <ToastProvider>
      <SuperAdminProvider>
        <AuthProvider>
          <OwnerPortalProvider>
            <TenantPortalProvider>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </TenantPortalProvider>
          </OwnerPortalProvider>
        </AuthProvider>
      </SuperAdminProvider>
    </ToastProvider>
  )
}