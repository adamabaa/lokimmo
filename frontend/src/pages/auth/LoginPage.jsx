import { useState, useEffect } from 'react'
import { Link, useNavigate }   from 'react-router-dom'
import { useAuth }             from '../../context/AuthContext'
import { useToast }            from '../../context/ToastContext'
import Alert                   from '../../components/ui/Alert'
import Spinner                 from '../../components/ui/Spinner'
import {
  Home, Users, FileText, TrendingUp,
  Shield, Star, ArrowRight, Building2,
} from 'lucide-react'

const FEATURES = [
  { icon: <Home size={18} />,        text: 'Gérez vos biens immobiliers',        color: '#d4a853' },
  { icon: <Users size={18} />,       text: 'Suivez vos locataires et propriétaires', color: '#5b9cf6' },
  { icon: <FileText size={18} />,    text: 'Contrats et quittances PDF auto',    color: '#3ecf8e' },
  { icon: <TrendingUp size={18} />,  text: 'Dashboard et analytics en temps réel', color: '#a78bfa' },
  { icon: <Shield size={18} />,      text: 'Score locatif intelligent sur 100pts', color: '#e5534b' },
  { icon: <Star size={18} />,        text: 'Portails locataires et propriétaires', color: '#d4a853' },
  { icon: <Building2 size={18} />,   text: 'Multi-agences sur une seule plateforme', color: '#5b9cf6' },
]

function TypingFeatures() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [displayed,    setDisplayed]    = useState('')
  const [isDeleting,   setIsDeleting]   = useState(false)
  const [charIndex,    setCharIndex]    = useState(0)

  const current = FEATURES[currentIndex]

  useEffect(() => {
    const fullText = current.text
    let timeout

    const updateText = () => {
      if (!isDeleting && charIndex < fullText.length) {
        setDisplayed(fullText.slice(0, charIndex + 1))
        setCharIndex(c => c + 1)
      } else if (!isDeleting && charIndex === fullText.length) {
        // Utiliser setTimeout pour différer le setState
        timeout = setTimeout(() => setIsDeleting(true), 2000)
      } else if (isDeleting && charIndex > 0) {
        setDisplayed(fullText.slice(0, charIndex - 1))
        setCharIndex(c => c - 1)
      } else if (isDeleting && charIndex === 0) {
        // Utiliser setTimeout pour différer les setState
        timeout = setTimeout(() => {
          setIsDeleting(false)
          setCurrentIndex(i => (i + 1) % FEATURES.length)
        }, 0)
      }
    }

    updateText()

    // Configuration du prochain timeout si nécessaire
    if ((!isDeleting && charIndex < fullText.length) ||
        (isDeleting && charIndex > 0)) {
      const delay = isDeleting ? 20 : 45
      timeout = setTimeout(() => {
        // Forcer une nouvelle exécution via une mise à jour d'état
        setCharIndex(c => c)
      }, delay)
    }

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [charIndex, isDeleting, current.text])

  return (
    <div style={{ minHeight: '36px', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ color: current.color, flexShrink: 0 }}>{current.icon}</span>
      <span style={{
        fontSize:   '1.1rem',
        fontWeight: 500,
        color:      '#f0ece4',
        lineHeight: 1.4,
      }}>
        {displayed}
        <span style={{
          display:    'inline-block',
          width:      '2px',
          height:     '1.1em',
          background: current.color,
          marginLeft: '2px',
          verticalAlign: 'middle',
          animation: 'pulse 1s infinite',
        }} />
      </span>
    </div>
  )
}

export default function LoginPage() {
  const { login }  = useAuth()
  const { show }   = useToast()
  const navigate   = useNavigate()

  const [form,    setForm]    = useState({ email: '', password: '', slug: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await login(form.email, form.password, form.slug)
      show('Connexion réussie', 'success')
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion')
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight:  '100vh',
      display:    'flex',
      background: '#0a0c10',
      justifyContent: isMobile ? 'center' : 'flex-start',
    }}>

      {/* ── Côté gauche — Présentation ── */}
      {!isMobile && (
        <div className="hide-on-mobile" style={{
          flex:           1,
          display:        'flex',
          flexDirection:  'column',
          justifyContent: 'center',
          padding:        '3rem 4rem',
          background:     'linear-gradient(135deg, #0d1117 0%, #0f1420 100%)',
          borderRight:    '1px solid rgba(255,255,255,0.05)',
          position:       'relative',
          overflow:       'hidden',
        }}>

        {/* Effets de fond */}
        <div style={{
          position:   'absolute', top: '-10%', right: '-5%',
          width:      '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,168,83,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position:   'absolute', bottom: '10%', left: '-5%',
          width:      '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(91,156,246,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Grille décorative */}
        <div style={{
          position:   'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ marginBottom: '3rem', position: 'relative' }}>
          <div style={{
            fontFamily:    'var(--font-display)',
            fontSize:      '2rem',
            fontWeight:    700,
            color:         '#d4a853',
            letterSpacing: '-0.02em',
            marginBottom:  '8px',
          }}>
            Lokimmo
          </div>
          <div style={{
            display:      'inline-flex',
            alignItems:   'center',
            gap:          '6px',
            background:   'rgba(212,168,83,0.1)',
            border:       '1px solid rgba(212,168,83,0.2)',
            borderRadius: '20px',
            padding:      '3px 12px',
            fontSize:     '0.72rem',
            color:        '#d4a853',
            letterSpacing:'0.08em',
            textTransform:'uppercase',
          }}>
            SaaS Immobilier — Afrique de l'Ouest
          </div>
        </div>

        {/* Titre */}
        <div style={{ marginBottom: '2rem', position: 'relative' }}>
          <h1 style={{
            fontSize:      '2.2rem',
            fontFamily:    'var(--font-display)',
            fontWeight:    600,
            color:         '#f0ece4',
            lineHeight:    1.2,
            marginBottom:  '1rem',
            letterSpacing: '-0.02em',
          }}>
            La plateforme de<br />
            <span style={{ color: '#d4a853' }}>gestion locative</span><br />
            pour les agences
          </h1>
          <p style={{ color: '#8b8d96', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Gérez tous vos biens, locataires et propriétaires<br />
            depuis une seule interface moderne.
          </p>
        </div>

        {/* Typing effect */}
        <div style={{
          background:   'rgba(255,255,255,0.03)',
          border:       '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px',
          padding:      '1.25rem 1.5rem',
          marginBottom: '2.5rem',
          position:     'relative',
        }}>
          <div style={{ fontSize: '0.68rem', color: '#555761', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
            Fonctionnalités
          </div>
          <TypingFeatures />
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem', position: 'relative',
        }}>
          {[
            { value: '100%', label: 'Multi-tenant' },
            { value: '5★',   label: 'Score locatif' },
            { value: '∞',    label: 'Plan Pro' },
          ].map((stat, i) => (
            <div key={i} style={{
              textAlign: 'center',
              padding:   '0.75rem',
              background:'rgba(255,255,255,0.02)',
              borderRadius:'8px',
              border:   '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#d4a853', fontFamily: 'var(--font-display)' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#555761', marginTop: '2px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Immeubles décoratifs SVG */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: '120px', overflow: 'hidden', opacity: 0.15,
          pointerEvents: 'none',
        }}>
          <svg viewBox="0 0 800 120" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
            {/* Immeuble 1 */}
            <rect x="20"  y="40"  width="60" height="80" fill="#d4a853" />
            <rect x="25"  y="45"  width="10" height="12" fill="#0a0c10" opacity="0.5" />
            <rect x="40"  y="45"  width="10" height="12" fill="#0a0c10" opacity="0.5" />
            <rect x="55"  y="45"  width="10" height="12" fill="#d4a853" opacity="0.8" />
            <rect x="25"  y="65"  width="10" height="12" fill="#0a0c10" opacity="0.5" />
            <rect x="40"  y="65"  width="10" height="12" fill="#d4a853" opacity="0.8" />
            <rect x="55"  y="65"  width="10" height="12" fill="#0a0c10" opacity="0.5" />
            <rect x="25"  y="85"  width="10" height="12" fill="#d4a853" opacity="0.8" />
            <rect x="40"  y="85"  width="10" height="12" fill="#0a0c10" opacity="0.5" />
            <rect x="55"  y="85"  width="10" height="12" fill="#d4a853" opacity="0.8" />
            {/* Immeuble 2 — plus grand */}
            <rect x="100" y="10"  width="80" height="110" fill="#5b9cf6" />
            <rect x="108" y="18"  width="12" height="14" fill="#0a0c10" opacity="0.5" />
            <rect x="126" y="18"  width="12" height="14" fill="#5b9cf6" opacity="0.8" />
            <rect x="144" y="18"  width="12" height="14" fill="#0a0c10" opacity="0.5" />
            <rect x="162" y="18"  width="12" height="14" fill="#5b9cf6" opacity="0.8" />
            <rect x="108" y="40"  width="12" height="14" fill="#5b9cf6" opacity="0.8" />
            <rect x="126" y="40"  width="12" height="14" fill="#0a0c10" opacity="0.5" />
            <rect x="144" y="40"  width="12" height="14" fill="#5b9cf6" opacity="0.8" />
            <rect x="162" y="40"  width="12" height="14" fill="#0a0c10" opacity="0.5" />
            <rect x="108" y="62"  width="12" height="14" fill="#0a0c10" opacity="0.5" />
            <rect x="126" y="62"  width="12" height="14" fill="#5b9cf6" opacity="0.8" />
            <rect x="144" y="62"  width="12" height="14" fill="#0a0c10" opacity="0.5" />
            <rect x="162" y="62"  width="12" height="14" fill="#5b9cf6" opacity="0.8" />
            <rect x="108" y="84"  width="12" height="14" fill="#5b9cf6" opacity="0.8" />
            <rect x="126" y="84"  width="12" height="14" fill="#0a0c10" opacity="0.5" />
            <rect x="144" y="84"  width="12" height="14" fill="#0a0c10" opacity="0.5" />
            <rect x="162" y="84"  width="12" height="14" fill="#5b9cf6" opacity="0.8" />
            {/* Immeuble 3 */}
            <rect x="200" y="55"  width="50" height="65" fill="#3ecf8e" />
            <rect x="208" y="62"  width="10" height="10" fill="#0a0c10" opacity="0.5" />
            <rect x="224" y="62"  width="10" height="10" fill="#3ecf8e" opacity="0.8" />
            <rect x="208" y="78"  width="10" height="10" fill="#3ecf8e" opacity="0.8" />
            <rect x="224" y="78"  width="10" height="10" fill="#0a0c10" opacity="0.5" />
            <rect x="208" y="94"  width="10" height="10" fill="#0a0c10" opacity="0.5" />
            <rect x="224" y="94"  width="10" height="10" fill="#3ecf8e" opacity="0.8" />
            {/* Immeuble 4 — très grand */}
            <rect x="270" y="0"   width="100" height="120" fill="#d4a853" opacity="0.7" />
            <rect x="280" y="8"   width="14" height="16" fill="#0a0c10" opacity="0.4" />
            <rect x="300" y="8"   width="14" height="16" fill="#d4a853" opacity="0.9" />
            <rect x="320" y="8"   width="14" height="16" fill="#0a0c10" opacity="0.4" />
            <rect x="340" y="8"   width="14" height="16" fill="#d4a853" opacity="0.9" />
            <rect x="280" y="32"  width="14" height="16" fill="#d4a853" opacity="0.9" />
            <rect x="300" y="32"  width="14" height="16" fill="#0a0c10" opacity="0.4" />
            <rect x="320" y="32"  width="14" height="16" fill="#d4a853" opacity="0.9" />
            <rect x="340" y="32"  width="14" height="16" fill="#0a0c10" opacity="0.4" />
            <rect x="280" y="56"  width="14" height="16" fill="#0a0c10" opacity="0.4" />
            <rect x="300" y="56"  width="14" height="16" fill="#d4a853" opacity="0.9" />
            <rect x="320" y="56"  width="14" height="16" fill="#0a0c10" opacity="0.4" />
            <rect x="340" y="56"  width="14" height="16" fill="#d4a853" opacity="0.9" />
            <rect x="280" y="80"  width="14" height="16" fill="#d4a853" opacity="0.9" />
            <rect x="300" y="80"  width="14" height="16" fill="#0a0c10" opacity="0.4" />
            <rect x="320" y="80"  width="14" height="16" fill="#d4a853" opacity="0.9" />
            <rect x="340" y="80"  width="14" height="16" fill="#0a0c10" opacity="0.4" />
            {/* Sol */}
            <rect x="0" y="118" width="800" height="4" fill="#d4a853" opacity="0.3" />
          </svg>
        </div>
        </div>
      )}

      {/* ── Côté droit — Formulaire ── */}
      <div style={{
        width:          '100%',
        maxWidth:       '480px',
        display:        'flex',
        flexDirection:  'column',
        justifyContent: 'center',
        padding:        '2rem 3rem',
        background:     '#0f1117',
        position:       'relative',
      }}>

        {/* Effet fond */}
        <div style={{
          position:   'absolute', bottom: '20%', right: '-10%',
          width:      '250px', height: '250px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,168,83,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo mobile (masqué sur desktop) */}
        <div className="show-on-mobile" style={{
          textAlign:     'center',
          marginBottom:  '2rem',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize:   '1.8rem',
            fontWeight: 700,
            color:      '#d4a853',
          }}>
            Lokimmo
          </div>
        </div>

        {/* Header formulaire */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{
            fontFamily:    'var(--font-display)',
            fontSize:      '1.6rem',
            fontWeight:    600,
            color:         '#f0ece4',
            marginBottom:  '8px',
            letterSpacing: '-0.02em',
          }}>
            Bon retour
          </h2>
          <p style={{ color: '#8b8d96', fontSize: '0.875rem' }}>
            Connectez-vous à votre espace agence
          </p>
        </div>

        {/* Formulaire */}
        <div>
          <Alert type="error" message={error} onClose={() => setError('')} />

          <form onSubmit={submit}>
            <div className="lk-input-group">
              <label className="lk-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Building2 size={13} /> Slug de l'agence
              </label>
              <input
                className="lk-input" type="text" name="slug"
                placeholder="aksum-immo" value={form.slug}
                onChange={handle} required
                style={{ fontSize: '0.9rem' }}
              />
              <div style={{ fontSize: '0.72rem', color: '#555761', marginTop: '3px' }}>
                Fourni par votre administrateur
              </div>
            </div>

            <div className="lk-input-group">
              <label className="lk-label">Email</label>
              <input
                className="lk-input" type="email" name="email"
                placeholder="vous@agence.com" value={form.email}
                onChange={handle} required
                style={{ fontSize: '0.9rem' }}
              />
            </div>

            <div className="lk-input-group" style={{ marginBottom: '2rem' }}>
              <label className="lk-label">Mot de passe</label>
              <input
                className="lk-input" type="password" name="password"
                placeholder="••••••••" value={form.password}
                onChange={handle} required
                style={{ fontSize: '0.9rem' }}
              />
            </div>

            <button
              type="submit"
              className="lk-btn lk-btn-primary"
              style={{
                width:          '100%',
                justifyContent: 'center',
                padding:        '0.85rem',
                fontSize:       '0.9rem',
                fontWeight:     500,
                display:        'flex',
                alignItems:     'center',
                gap:            '8px',
              }}
              disabled={loading}
            >
              {loading
                ? <Spinner size="sm" />
                : <><ArrowRight size={16} /> Se connecter</>
              }
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display:    'flex', alignItems: 'center', gap: '1rem',
            margin:     '1.5rem 0',
            color:      '#333',
            fontSize:   '0.75rem',
          }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            ou
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#8b8d96' }}>
            Pas encore de compte ?{' '}
            <Link to="/register" style={{
              color:          '#d4a853',
              textDecoration: 'none',
              fontWeight:     500,
            }}>
              Créer une agence →
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div style={{
          position:  'absolute',
          bottom:    '1.5rem',
          left:      '3rem',
          right:     '3rem',
          textAlign: 'center',
          fontSize:  '0.72rem',
          color:     '#333',
        }}>
          Lokimmo © 2026 — Powered by Anthropic Claude
        </div>
      </div>
    </div>
  )
}