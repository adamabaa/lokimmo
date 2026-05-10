import { createContext, useContext } from 'react'

export const OwnerPortalContext = createContext(null)
export const useOwnerPortal = () => useContext(OwnerPortalContext)