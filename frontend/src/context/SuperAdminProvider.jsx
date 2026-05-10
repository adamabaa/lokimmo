import { useState, useEffect }  from 'react'
import { SuperAdminContext }     from './SuperAdminContext'
import { superAdminApi }         from '../api/superAdminApi'

export function SuperAdminProvider({ children }) {
  const [superAdmin, setSuperAdmin] = useState(null)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('lk_super_token')
      if (token) {
        try {
          const res = await superAdminApi.me()
          setSuperAdmin(res.data.data)
        } catch {
          localStorage.removeItem('lk_super_token')
          localStorage.removeItem('lk_super_admin')
        }
      }
      setLoading(false)
    }
    init()
  }, [])

  const login = async (email, password) => {
    const res  = await superAdminApi.login({ email, password })
    const data = res.data.data
    localStorage.setItem('lk_super_token', data.token)
    localStorage.setItem('lk_super_admin', JSON.stringify(data.super_admin))
    setSuperAdmin(data.super_admin)
    return data
  }

  const logout = () => {
    localStorage.removeItem('lk_super_token')
    localStorage.removeItem('lk_super_admin')
    setSuperAdmin(null)
    window.location.href = '/super/login'
  }

  return (
    <SuperAdminContext.Provider value={{ superAdmin, loading, login, logout }}>
      {children}
    </SuperAdminContext.Provider>
  )
}