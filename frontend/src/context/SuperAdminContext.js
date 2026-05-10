import { createContext, useContext } from 'react'

export const SuperAdminContext = createContext(null)
export const useSuperAdmin = () => useContext(SuperAdminContext)