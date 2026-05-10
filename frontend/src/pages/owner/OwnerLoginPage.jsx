import { useState }       from 'react'
import { useNavigate, Link }    from 'react-router-dom'
import { useOwnerPortal } from '../../context/OwnerPortalContext'
import Alert              from '../../components/ui/Alert'
import Spinner            from '../../components/ui/Spinner'
import { Building2, ArrowRight, Key } from 'lucide-react'

export default function OwnerLoginPage() {
  const { login }  = useOwnerPortal()
  const navigate   = useNavigate()

  const [form,    setForm]    = useState({ email: '', password: '', slug: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await login(form.email, form.password, form.slug)
      navigate('/owner/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion')
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight:      '100vh',
      background:     '#0a0c10',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '1rem',
      position:       'relative',
      overflow:       'hidden',
    }}>

      {/* Effets de fond */}
      <div style={{
        position:   'fixed', top: '10%', left: '50%',
        transform:  'translateX(-50%)',
        width:      '600px', height: '400px',
        background: 'radial-gradient(ellipse, rgba(212,168,83,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position:   'fixed', bottom: '0', left: '10%',
        width:      '400px', height: '300px',
        background: 'radial-gradient(ellipse, rgba(91,156,246,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Grille décorative */}
      <div style={{
        position:   'fixed', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '420px', animation: 'fadeInScale 0.4s ease', position: 'relative' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            fontFamily:    'var(--font-display)',
            fontSize:      '2rem', fontWeight: 700,
            color:         '#f0ece4', letterSpacing: '-0.02em',
            marginBottom:  '1rem',
          }}>
            Lokimmo
          </div>
          <div style={{
            display:      'inline-flex', alignItems: 'center', gap: '7px',
            background:   'rgba(212,168,83,0.08)',
            border:       '1px solid rgba(212,168,83,0.2)',
            borderRadius: '20px', padding: '5px 16px',
            fontSize:     '0.78rem', color: '#d4a853',
            letterSpacing:'0.06em', textTransform: 'uppercase',
          }}>
            <Building2 size={13} /> Espace Propriétaire
          </div>
        </div>

        {/* Card */}
        <div style={{
          background:   '#161920',
          border:       '1px solid rgba(255,255,255,0.07)',
          borderRadius: '16px',
          padding:      '2rem',
          boxShadow:    '0 24px 64px rgba(0,0,0,0.4)',
          position:     'relative',
          overflow:     'hidden',
        }}>
          {/* Accent top */}
          <div style={{
            position:   'absolute', top: 0, left: 0, right: 0,
            height:     '2px',
            background: 'linear-gradient(90deg, #d4a853, transparent)',
          }} />

          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{
              fontFamily:    'var(--font-display)',
              fontSize:      '1.25rem', fontWeight: 600,
              color:         '#f0ece4', marginBottom: '4px',
            }}>
              Bon retour
            </h2>
            <p style={{ color: '#8b8d96', fontSize: '0.8rem' }}>
              Suivez vos biens et revenus
            </p>
          </div>

          <Alert type="error" message={error} onClose={() => setError('')} />

          <form onSubmit={submit}>
            <div className="lk-input-group">
              <label className="lk-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Building2 size={12} /> Slug de l'agence
              </label>
              <input
                className="lk-input" type="text" placeholder="aksum-immo"
                value={form.slug}
                onChange={e => setForm({ ...form, slug: e.target.value })}
                required
              />
              <div style={{ fontSize: '0.72rem', color: '#555761', marginTop: '3px' }}>
                Fourni par votre agence
              </div>
            </div>

            <div className="lk-input-group">
              <label className="lk-label">Email</label>
              <input
                className="lk-input" type="email" placeholder="votre@email.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="lk-input-group" style={{ marginBottom: '1.5rem' }}>
              <label className="lk-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Key size={12} /> Mot de passe
              </label>
              <input
                className="lk-input" type="password" placeholder="••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width:          '100%', padding: '0.8rem',
                background:     loading ? 'rgba(212,168,83,0.5)' : '#d4a853',
                color:          '#0a0c10',
                border:         'none', borderRadius: '10px',
                fontSize:       '0.9rem', fontWeight: 600,
                cursor:         loading ? 'not-allowed' : 'pointer',
                display:        'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px',
                transition:     'all 0.2s',
                boxShadow:      loading ? 'none' : '0 4px 16px rgba(212,168,83,0.25)',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {loading
                ? <Spinner size="sm" />
                : <><ArrowRight size={16} /> Se connecter</>
              }
            </button>
          </form>
        </div>

        {/* Footer */}
        <p style={{
          textAlign:  'center', marginTop: '1.5rem',
          fontSize:   '0.75rem', color: '#333',
        }}>
          Vous êtes locataire ?{' '}
          <Link to="/tenant/login" style={{ color: '#3ecf8e', textDecoration: 'none' }}>
            Espace locataire →
          </Link>
        </p>
      </div>
    </div>
  )
}