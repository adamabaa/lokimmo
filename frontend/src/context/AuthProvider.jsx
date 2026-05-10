import { useState, useEffect }          from 'react'
import { AuthContext }                   from './AuthContext'
import { authApi }                       from '../api/authApi'
import { agencyApi }                     from '../api/agencyApi'
import { applyAgencyTheme, resetTheme }  from '../utils/colorUtils'
import { checkTokenOnStartup } from '../utils/security'

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [agency,  setAgency]  = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      // Vérifier le token avant tout
      const hasValidToken = checkTokenOnStartup()

      if (hasValidToken) {
        try {
          const [userRes, agencyRes] = await Promise.all([
            authApi.me(),
            agencyApi.getProfile(),
          ])
          setUser(userRes.data.data)
          setAgency(agencyRes.data.data)
          applyAgencyTheme(agencyRes.data.data)
        } catch {
          localStorage.removeItem('lk_token')
          localStorage.removeItem('lk_user')
          localStorage.removeItem('lk_slug')
        }
      }
      setLoading(false)
    }
    init()
  }, [])

  // ← Nouveau : recharger le profil agence sans déconnexion
  const refreshAgency = async () => {
    try {
      const res        = await agencyApi.getProfile()
      const agencyData = res.data.data
      setAgency(agencyData)
      applyAgencyTheme(agencyData)
    } catch { /* silencieux */ }
  }

  const login = async (email, password, slug) => {
    localStorage.setItem('lk_slug', slug)
    const res  = await authApi.login({ email, password })
    const data = res.data.data
    localStorage.setItem('lk_token', data.token)
    localStorage.setItem('lk_user',  JSON.stringify(data.user))
    setUser(data.user)
    try {
      const agencyRes  = await agencyApi.getProfile()
      const agencyData = agencyRes.data.data
      setAgency(agencyData)
      applyAgencyTheme(agencyData)
    } catch { /* thème par défaut */ }
    return data
  }

  const register = async (formData) => {
    const res  = await authApi.register(formData)
    const data = res.data.data
    localStorage.setItem('lk_token', data.token)
    localStorage.setItem('lk_slug',  formData.agency_slug)
    localStorage.setItem('lk_user',  JSON.stringify(data.user))
    setUser(data.user)
    return data
  }

  const logout = () => {
    localStorage.removeItem('lk_token')
    localStorage.removeItem('lk_user')
    localStorage.removeItem('lk_slug')
    resetTheme()
    setUser(null)
    setAgency(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, agency, loading, login, register, logout, refreshAgency }}>
      {children}
    </AuthContext.Provider>
  )
}