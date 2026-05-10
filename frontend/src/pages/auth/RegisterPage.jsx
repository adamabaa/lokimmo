import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import Alert from '../../components/ui/Alert'
import Spinner from '../../components/ui/Spinner'
import { generateSlug } from '../../utils/security'

export default function RegisterPage() {
  const { register } = useAuth()
  const { show }     = useToast()
  const navigate     = useNavigate()

  const [form, setForm] = useState({
    agency_name:           '',
    agency_slug:           '',
    first_name:            '',
    last_name:             '',
    email:                 '',
    password:              '',
    password_confirmation: '',
  })
  const [error,   setError]   = useState('')
    const [loading, setLoading] = useState(false)

  const handle = (e) => {
  const { name, value } = e.target
    if (name === 'agency_name') {
      setForm({
        ...form,
        agency_name: value,
        agency_slug: generateSlug(value), // ← gère les accents
      })
    } else {
      setForm({ ...form, [name]: value })
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.password_confirmation) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    setLoading(true)
    try {
      await register(form)
      show('Agence créée avec succès !', 'success')
      navigate('/dashboard')
    } catch (err) {
      const errors = err.response?.data?.errors
      if (errors) {
        const first = Object.values(errors)[0]
        setError(Array.isArray(first) ? first[0] : first)
      } else {
        setError(err.response?.data?.message || 'Erreur lors de l\'inscription')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight:      '100vh',
      background:     'var(--lk-dark)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '2rem 1rem',
    }}>
      <div style={{
        position:     'fixed',
        bottom:       '-20%',
        left:         '-10%',
        width:        '500px',
        height:       '500px',
        borderRadius: '50%',
        background:   'radial-gradient(circle, rgba(212,168,83,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width:     '100%',
        maxWidth:  '480px',
        animation: 'fadeInScale 0.4s ease',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            fontFamily:    'var(--font-display)',
            fontSize:      '2.2rem',
            fontWeight:    600,
            color:         'var(--lk-amber)',
            letterSpacing: '-0.02em',
          }}>
            Lokimmo
          </div>
          <p style={{ color: 'var(--lk-text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Créez votre espace de gestion locative
          </p>
        </div>

        <div className="lk-card" style={{ padding: '2rem' }}>
          <Alert type="error" message={error} onClose={() => setError('')} />

          <form onSubmit={submit}>
            {/* Agence */}
            <div style={{
              fontSize:      '0.7rem',
              color:         'var(--lk-amber)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom:  '1rem',
              fontWeight:    500,
            }}>
              Informations de l'agence
            </div>

            <div className="lk-input-group">
              <label className="lk-label">Nom de l'agence</label>
              <input
                className="lk-input"
                type="text"
                name="agency_name"
                placeholder="Agence Dakar Immo"
                value={form.agency_name}
                onChange={handle}
                required
              />
            </div>

            <div className="lk-input-group">
              <label className="lk-label">Slug (sous-domaine)</label>
              <input
                className="lk-input"
                type="text"
                name="agency_slug"
                placeholder="agence-dakar"
                value={form.agency_slug}
                onChange={handle}
                required
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--lk-text-muted)', marginTop: '4px' }}>
                → {form.agency_slug || 'votre-agence'}.lokimmo.com
              </div>
            </div>

            <div className="lk-divider" />

            {/* Admin */}
            <div style={{
              fontSize:      '0.7rem',
              color:         'var(--lk-amber)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom:  '1rem',
              fontWeight:    500,
            }}>
              Votre compte administrateur
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="lk-input-group" style={{ marginBottom: 0 }}>
                <label className="lk-label">Prénom</label>
                <input className="lk-input" type="text" name="first_name"
                  placeholder="Adama" value={form.first_name} onChange={handle} required />
              </div>
              <div className="lk-input-group" style={{ marginBottom: 0 }}>
                <label className="lk-label">Nom</label>
                <input className="lk-input" type="text" name="last_name"
                  placeholder="Ba" value={form.last_name} onChange={handle} required />
              </div>
            </div>

            <div className="lk-input-group" style={{ marginTop: '1rem' }}>
              <label className="lk-label">Email</label>
              <input className="lk-input" type="email" name="email"
                placeholder="adama@agence.com" value={form.email} onChange={handle} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="lk-input-group" style={{ marginBottom: 0 }}>
                <label className="lk-label">Mot de passe</label>
                <input className="lk-input" type="password" name="password"
                  placeholder="••••••••" value={form.password} onChange={handle} required />
              </div>
              <div className="lk-input-group" style={{ marginBottom: 0 }}>
                <label className="lk-label">Confirmation</label>
                <input className="lk-input" type="password" name="password_confirmation"
                  placeholder="••••••••" value={form.password_confirmation} onChange={handle} required />
              </div>
            </div>

            <button
              type="submit"
              className="lk-btn lk-btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', marginTop: '1.5rem' }}
              disabled={loading}
            >
              {loading ? <Spinner size="sm" /> : 'Créer mon agence'}
            </button>
          </form>
        </div>

        <p style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          fontSize:  '0.875rem',
          color:     'var(--lk-text-secondary)',
        }}>
          Déjà un compte ?{' '}
          <Link to="/login" style={{ color: 'var(--lk-amber)', textDecoration: 'none' }}>
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}