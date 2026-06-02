import {
  LayoutDashboard, Home, Users, UserCheck,
  FileText, CreditCard, Settings,
  Building2, TrendingDown, Wallet, X,
  Calendar, ChevronDown, ChevronRight,
  PiggyBank, Receipt,
} from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/lokimmo/backend/public'

// ── Composant groupe de navigation ───────────────────────────
function NavGroup({ label, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div style={{ marginBottom: '0.25rem' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width:          '100%',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '0.35rem 0.5rem',
          background:     'none',
          border:         'none',
          cursor:         'pointer',
          color:          'var(--lk-text-muted)',
          fontSize:       '0.65rem',
          letterSpacing:  '0.1em',
          textTransform:  'uppercase',
          fontWeight:     600,
          marginBottom:   '0.25rem',
          borderRadius:   'var(--radius-sm)',
          transition:     'color 0.15s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--lk-text-secondary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--lk-text-muted)'}
      >
        {label}
        {open
          ? <ChevronDown size={11} />
          : <ChevronRight size={11} />
        }
      </button>

      {open && (
        <div style={{ overflow: 'hidden' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ── Composant item de navigation ─────────────────────────────
function NavItem({ path, icon, label, isActive, onClick, disabled = false }) {
  if (disabled) {
    return (
      <div
        title="Bientôt disponible"
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '10px',
          padding:      '0.7rem 0.75rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '2px',
          color:        'var(--lk-text-muted)',
          fontSize:     '0.875rem',
          opacity:      0.5,
          cursor:       'not-allowed',
          userSelect:   'none',
        }}
      >
        <span style={{ flexShrink: 0 }}>{icon}</span>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {label}
        </span>
        <span style={{
          marginLeft:   'auto',
          fontSize:     '0.6rem',
          background:   'var(--lk-dark-4)',
          color:        'var(--lk-text-muted)',
          padding:      '1px 6px',
          borderRadius: '10px',
          flexShrink:   0,
        }}>
          bientôt
        </span>
      </div>
    )
  }

  return (
    <NavLink
      to={path}
      onClick={onClick}
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
      <span style={{ flexShrink: 0 }}>{icon}</span>
      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {label}
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
}

// ── Sidebar principale ────────────────────────────────────────
export default function Sidebar({ isOpen, onClose, isMobile }) {
  const { user, agency } = useAuth()
  const location         = useLocation()
  const isAdmin          = user?.role === 'admin'

  const isActive = (path) => location.pathname === path

  const handleClick = () => {
    if (isMobile && onClose) onClose()
  }

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

      {/* ── Header — logo agence ── */}
      <div style={{
        padding:        '1.25rem 1rem',
        borderBottom:   '1px solid var(--lk-border)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        flexShrink:     0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          {agency?.logo_url ? (
            <img
              src={`${API_URL}${agency.logo_url}`}
              alt={agency.name || 'Logo agence'}
              style={{
                width: 34, height: 34,
                borderRadius: 'var(--radius-md)',
                objectFit:    'cover',
                border:       '1px solid var(--lk-border-2)',
                flexShrink:   0,
              }}
            />
          ) : (
            <div style={{
              width:      34, height: 34,
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

        {isMobile && (
          <button
            onClick={onClose}
            aria-label="Fermer le menu"
            style={{
              background:     'var(--lk-dark-3)',
              border:         '1px solid var(--lk-border)',
              borderRadius:   'var(--radius-sm)',
              color:          'var(--lk-text-secondary)',
              cursor:         'pointer',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              width: 32, height: 32,
              flexShrink:     0,
              marginLeft:     '8px',
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav style={{ padding: '0.75rem', flex: 1, overflowY: 'auto' }}>

        {/* Principal */}
        <NavItem
          path="/dashboard"
          icon={<LayoutDashboard size={18} />}
          label="Dashboard"
          isActive={isActive('/dashboard')}
          onClick={handleClick}
        />

        <div style={{ marginTop: '0.75rem' }} />

        {/* Immobilier */}
        <NavGroup label="Immobilier">
          <NavItem
            path="/properties"
            icon={<Home size={18} />}
            label="Biens"
            isActive={isActive('/properties')}
            onClick={handleClick}
          />
          <NavItem
            path="/owners"
            icon={<Building2 size={18} />}
            label="Propriétaires"
            isActive={isActive('/owners')}
            onClick={handleClick}
          />
          <NavItem
            path="/tenants"
            icon={<UserCheck size={18} />}
            label="Locataires"
            isActive={isActive('/tenants')}
            onClick={handleClick}
          />
          <NavItem
            path="/contracts"
            icon={<FileText size={18} />}
            label="Contrats"
            isActive={isActive('/contracts')}
            onClick={handleClick}
          />
          {/* Visites — bientôt disponible */}
          <NavItem
            path="/visits"
            icon={<Calendar size={18} />}
            label="Visites"
            isActive={false}
            onClick={handleClick}
            disabled
          />
        </NavGroup>

        {/* Finances */}
        <NavGroup label="Finances">
          <NavItem
            path="/payments"
            icon={<Receipt size={18} />}
            label="Paiements"
            isActive={isActive('/payments')}
            onClick={handleClick}
          />
          <NavItem
            path="/expenses"
            icon={<TrendingDown size={18} />}
            label="Dépenses"
            isActive={isActive('/expenses')}
            onClick={handleClick}
          />
          <NavItem
            path="/cash"
            icon={<PiggyBank size={18} />}
            label="Caisse"
            isActive={isActive('/cash')}
            onClick={handleClick}
          />
        </NavGroup>

        {/* Équipe — admin seulement */}
        {isAdmin && (
          <NavGroup label="Équipe">
            <NavItem
              path="/users"
              icon={<Users size={18} />}
              label="Membres"
              isActive={isActive('/users')}
              onClick={handleClick}
            />
          </NavGroup>
        )}

        {/* Mon agence — admin seulement */}
        {isAdmin && (
          <NavGroup label="Mon agence">
            <NavItem
              path="/profile"
              icon={<Settings size={18} />}
              label="Paramètres"
              isActive={isActive('/profile')}
              onClick={handleClick}
            />
            <NavItem
              path="/billing"
              icon={<CreditCard size={18} />}
              label="Facturation"
              isActive={isActive('/billing')}
              onClick={handleClick}
            />
          </NavGroup>
        )}
      </nav>

      {/* ── Footer — info utilisateur ── */}
      <div style={{
        padding:      '0.875rem 1rem',
        borderTop:    '1px solid var(--lk-border)',
        flexShrink:   0,
      }}>
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '8px',
        }}>
          <div style={{
            width:          32, height: 32,
            borderRadius:   '50%',
            background:     'var(--lk-amber-bg-2)',
            border:         '1px solid rgba(212,168,83,0.3)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            color:          'var(--lk-amber)',
            fontSize:       '0.8rem',
            fontWeight:     600,
            flexShrink:     0,
          }}>
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize:     '0.8rem',
              fontWeight:   500,
              color:        'var(--lk-text-primary)',
              whiteSpace:   'nowrap',
              overflow:     'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user?.name || 'Utilisateur'}
            </div>
            <div style={{
              fontSize:      '0.65rem',
              color:         'var(--lk-text-muted)',
              textTransform: 'capitalize',
            }}>
              {user?.role || 'agent'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}