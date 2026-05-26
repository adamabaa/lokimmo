import {
  LayoutDashboard, Home, Users, UserCheck,
  FileText, CreditCard, Settings,
  Building2, TrendingUp, Wallet, X
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/lokimmo/backend/public'

export default function Sidebar({ isOpen, onClose, isMobile }) {
  const { user, agency } = useAuth()
  const location         = useLocation()
  const isAdmin          = user?.role === 'admin'

  const navItems = [
    { path: '/dashboard',  icon: <LayoutDashboard size={18} />, label: 'Dashboard',     show: true },
    { path: '/properties', icon: <Home size={18} />,            label: 'Biens',          show: true },
    { path: '/owners',     icon: <Building2 size={18} />,       label: 'Propriétaires',  show: true },
    { path: '/tenants',    icon: <UserCheck size={18} />,       label: 'Locataires',     show: true },
    { path: '/contracts',  icon: <FileText size={18} />,        label: 'Contrats',       show: true },
    { path: '/payments',   icon: <Wallet size={18} />,          label: 'Paiements',      show: true },
    { path: '/expenses',   icon: <TrendingUp size={18} />,      label: 'Dépenses',       show: true },
    { path: '/cash',       icon: <Wallet size={18} />,          label: 'Caisse',         show: true },
    { path: '/users',      icon: <Users size={18} />,           label: 'Équipe',         show: isAdmin },
    { path: '/profile',    icon: <Settings size={18} />,        label: 'Mon agence',     show: isAdmin },
    { path: '/billing',    icon: <CreditCard size={18} />,      label: 'Facturation',    show: isAdmin },
  ]

  return (
    <aside style={{
      width:         'var(--sidebar-width)',
      height:        '100vh',
      background:    'var(--lk-dark-2)',
      borderRight:   '1px solid var(--lk-border)',
      position:      'fixed',
      top:           0,
      left:          0,
      display:       'flex',
      flexDirection: 'column',
      zIndex:        100,
      transform:     isMobile
                       ? (isOpen ? 'translateX(0)' : 'translateX(-100%)')
                       : 'translateX(0)',
      transition:    'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
      overflowY:     'auto',
      overflowX:     'hidden',
    }}>

      {/* Header sidebar — logo + bouton fermeture */}
      <div style={{
        padding:      '1.25rem 1rem',
        borderBottom: '1px solid var(--lk-border)',
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'space-between',
        flexShrink:   0,
      }}>
        {/* Logo agence */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          {agency?.logo_url ? (
            <img
              src={`${API_URL}${agency.logo_url}`}
              alt={agency.name}
              style={{
                width: 34, height: 34,
                borderRadius: 'var(--radius-md)',
                objectFit: 'cover',
                border: '1px solid var(--lk-border-2)',
                flexShrink: 0,
              }}
            />
          ) : (
            <div style={{
              width: 34, height: 34,
              borderRadius: 'var(--radius-md)',
              background:   'var(--lk-amber-bg-2)',
              border:       '1px solid rgba(212,168,83,0.3)',
              display:      'flex', alignItems: 'center', justifyContent: 'center',
              color:        'var(--lk-amber)',
              flexShrink:   0,
            }}>
              <Building2 size={16} />
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily:    'var(--font-display)',
              fontSize:      '1rem',
              fontWeight:    600,
              color:         'var(--lk-amber)',
              letterSpacing: '-0.02em',
              whiteSpace:    'nowrap',
              overflow:      'hidden',
              textOverflow:  'ellipsis',
            }}>
              {agency?.name || 'Lokimmo'}
            </div>
            <div style={{
              fontSize:      '0.65rem',
              color:         'var(--lk-text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              {agency?.plan || 'Free'}
            </div>
          </div>
        </div>

        {/* Bouton fermeture — toujours visible sur mobile */}
        {isMobile && (
          <button
            onClick={onClose}
            aria-label="Fermer le menu"
            style={{
              background:   'var(--lk-dark-3)',
              border:       '1px solid var(--lk-border)',
              borderRadius: 'var(--radius-sm)',
              color:        'var(--lk-text-secondary)',
              cursor:       'pointer',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              width:        32, height: 32,
              flexShrink:   0,
              marginLeft:   '8px',
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ padding: '0.75rem', flex: 1, overflowY: 'auto' }}>
        <div style={{
          fontSize:      '0.65rem',
          color:         'var(--lk-text-muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          padding:       '0 0.5rem',
          marginBottom:  '0.5rem',
        }}>
          Menu principal
        </div>

        {navItems.filter(item => item.show).map((item) => {
          const isActive = location.pathname === item.path
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (isMobile && onClose) onClose()
              }}
              style={{
                display:        'flex',
                alignItems:     'center',
                gap:            '10px',
                padding:        '0.7rem 0.75rem',
                borderRadius:   'var(--radius-md)',
                marginBottom:   '2px',
                textDecoration: 'none',
                color:          isActive ? 'var(--lk-amber)' : 'var(--lk-text-secondary)',
                background:     isActive ? 'var(--lk-amber-bg)' : 'transparent',
                border:         `1px solid ${isActive ? 'rgba(212,168,83,0.15)' : 'transparent'}`,
                fontSize:       '0.875rem',
                fontWeight:     isActive ? 500 : 400,
                transition:     'all 0.15s ease',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--lk-dark-3)'
                  e.currentTarget.style.color      = 'var(--lk-text-primary)'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color      = 'var(--lk-text-secondary)'
                }
              }}
            >
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              <span style={{
                whiteSpace:   'nowrap',
                overflow:     'hidden',
                textOverflow: 'ellipsis',
              }}>
                {item.label}
              </span>
              {isActive && (
                <span style={{
                  marginLeft:   'auto',
                  width: 6, height: 6,
                  borderRadius: '50%',
                  background:   'var(--lk-amber)',
                  flexShrink:   0,
                }} />
              )}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}