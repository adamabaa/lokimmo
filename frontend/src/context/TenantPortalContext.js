import { createContext, useContext } from 'react'

export const TenantPortalContext = createContext(null)
export const useTenantPortal = () => useContext(TenantPortalContext)