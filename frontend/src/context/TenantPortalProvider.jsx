import { useState, useEffect }  from 'react'
import { TenantPortalContext }   from './TenantPortalContext'
import { portalApi }             from '../api/portalApi'

export function TenantPortalProvider({ children }) {
  const [tenant,  setTenant]  = useState(null)
  const [agency,  setAgency]  = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('lk_tenant_token')
      if (token) {
        try {
          const [tenantRes, agencyRes] = await Promise.all([
            portalApi.me(),
            portalApi.agency(),
          ])
          setTenant(tenantRes.data.data)
          setAgency(agencyRes.data.data)
        } catch {
          localStorage.removeItem('lk_tenant_token')
          localStorage.removeItem('lk_tenant_slug')
        }
      }
      setLoading(false)
    }
    init()
  }, [])

  const login = async (email, password, slug) => {
    localStorage.setItem('lk_tenant_slug', slug)
    const res  = await portalApi.login({ email, password })
    const data = res.data.data
    localStorage.setItem('lk_tenant_token', data.token)
    setTenant(data.tenant)
    const agencyRes = await portalApi.agency()
    setAgency(agencyRes.data.data)
    return data
  }

  const logout = () => {
    localStorage.removeItem('lk_tenant_token')
    localStorage.removeItem('lk_tenant_slug')
    setTenant(null)
    setAgency(null)
    window.location.href = '/tenant/login'
  }

  return (
    <TenantPortalContext.Provider value={{ tenant, agency, loading, login, logout }}>
      {children}
    </TenantPortalContext.Provider>
  )
}