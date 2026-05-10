import { useState, useEffect }   from 'react'
import { OwnerPortalContext }     from './OwnerPortalContext'
import { ownerPortalApi }         from '../api/ownerPortalApi'

export function OwnerPortalProvider({ children }) {
  const [owner,   setOwner]   = useState(null)
  const [agency,  setAgency]  = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('lk_owner_token')
      if (token) {
        try {
          const [ownerRes, agencyRes] = await Promise.all([
            ownerPortalApi.me(),
            ownerPortalApi.agency(),
          ])
          setOwner(ownerRes.data.data)
          setAgency(agencyRes.data.data)
        } catch {
          localStorage.removeItem('lk_owner_token')
          localStorage.removeItem('lk_owner_slug')
        }
      }
      setLoading(false)
    }
    init()
  }, [])

  const login = async (email, password, slug) => {
    localStorage.setItem('lk_owner_slug', slug)
    const res  = await ownerPortalApi.login({ email, password })
    const data = res.data.data
    localStorage.setItem('lk_owner_token', data.token)
    setOwner(data.owner)
    const agencyRes = await ownerPortalApi.agency()
    setAgency(agencyRes.data.data)
    return data
  }

  const logout = () => {
    localStorage.removeItem('lk_owner_token')
    localStorage.removeItem('lk_owner_slug')
    setOwner(null)
    setAgency(null)
    window.location.href = '/owner/login'
  }

  return (
    <OwnerPortalContext.Provider value={{ owner, agency, loading, login, logout }}>
      {children}
    </OwnerPortalContext.Provider>
  )
}