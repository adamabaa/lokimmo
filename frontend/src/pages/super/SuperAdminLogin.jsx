import { useState }      from 'react'
import { useNavigate }   from 'react-router-dom'
import { useSuperAdmin } from '../../context/SuperAdminContext'
import { useToast }      from '../../context/ToastContext'
import Alert             from '../../components/ui/Alert'
import Spinner           from '../../components/ui/Spinner'

export default function SuperAdminLogin() {
  const { login }    = useSuperAdmin()
  const { show }     = useToast()
  const navigate     = useNavigate()
  const [form,    setForm]    = useState({ email: '', password: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      show('Connexion Super Admin réussie', 'success')
      navigate('/super/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight:      '100vh',
      background:     '#0a0c10',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '1rem',
    }}>
      {/* Décor */}
      <div style={{
        position:      'fixed',
        top:           '10%',
        left:          '50%',
        transform:     'translateX(-50%)',
        width:         '600px',
        height:        '300px',
        background:    'radial-gradient(ellipse, rgba(91,156,246,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width:     '100%',
        maxWidth:  '400px',
        animation: 'fadeInScale 0.4s ease',
      }}>
        {/* Badge Super Admin */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display:        'inline-flex',
            alignItems:     'center',
            gap:            '8px',
            background:     'rgba(91,156,246,0.1)',
            border:         '1px solid rgba(91,156,246,0.2)',
            borderRadius:   '20px',
            padding:        '4px 16px',
            fontSize:       '0.75rem',
            color:          '#5b9cf6',
            letterSpacing:  '0.08em',
            textTransform:  'uppercase',
            marginBottom:   '1rem',
          }}>
            ⬡ Super Admin
          </div>
          <div style={{
            fontFamily:    'var(--font-display)',
            fontSize:      '2rem',
            fontWeight:    600,
            color:         '#f0ece4',
            letterSpacing: '-0.02em',
          }}>
            Lokimmo
          </div>
          <p style={{ color: '#8b8d96', fontSize: '0.875rem', marginTop: '4px' }}>
            Panneau d'administration
          </p>
        </div>

        <div style={{
          background:   '#161920',
          border:       '1px solid rgba(255,255,255,0.07)',
          borderRadius: '14px',
          padding:      '2rem',
        }}>
          <Alert type="error" message={error} onClose={() => setError('')} />

          <form onSubmit={submit}>
            <div className="lk-input-group">
              <label className="lk-label">Email</label>
              <input className="lk-input" type="email" placeholder="superadmin@lokimmo.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>

            <div className="lk-input-group" style={{ marginBottom: '1.5rem' }}>
              <label className="lk-label">Mot de passe</label>
              <input className="lk-input" type="password" placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>

            <button type="submit" disabled={loading}
              style={{
                width:          '100%',
                padding:        '0.75rem',
                background:     '#5b9cf6',
                color:          '#fff',
                border:         'none',
                borderRadius:   '10px',
                fontSize:       '0.875rem',
                fontWeight:     500,
                cursor:         loading ? 'not-allowed' : 'pointer',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            '8px',
                opacity:        loading ? 0.7 : 1,
                transition:     'all 0.2s',
              }}>
              {loading ? <Spinner size="sm" /> : 'Accéder au panneau'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}