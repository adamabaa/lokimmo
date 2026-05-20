import { Settings, LogOut, Menu } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import NotificationBell from '../ui/NotificationBell'

export default function Navbar({ title, subtitle, onMenuClick, isMobile }) {
  const { user, logout }                = useAuth()
  const slug                            = localStorage.getItem('lk_slug') || ''
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef                     = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header style={{
      height:               'var(--navbar-height)',
      background:           'rgba(15,17,23,0.85)',
      backdropFilter:       'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom:         '1px solid var(--lk-border)',
      display:              'flex',
      alignItems:           'center',
      justifyContent:       'space-between',
      padding:              isMobile ? '0 0.875rem' : '0 2rem',
      position:             'sticky',
      top:                  0,
      zIndex:               50,
      gap:                  '12px',
      flexShrink:           0,
    }}>

      {/* Gauche — Hamburger + Titre */}
      <div style={{
        display:    'flex',
        alignItems: 'center',
        gap:        '10px',
        minWidth:   0,
        flex:       1,
      }}>
        {isMobile && (
          <button
            onClick={onMenuClick}
            aria-label="Ouvrir le menu"
            style={{
              background:   'var(--lk-dark-3)',
              border:       '1px solid var(--lk-border)',
              borderRadius: 'var(--radius-sm)',
              color:        'var(--lk-text-primary)',
              cursor:       'pointer',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              width:        36, height: 36,
              flexShrink:   0,
            }}
          >
            <Menu size={20} />
          </button>
        )}

        <div style={{ minWidth: 0 }}>
          <h1 style={{
            fontSize:     isMobile ? '1rem' : '1.2rem',
            fontWeight:   600,
            color:        'var(--lk-text-primary)',
            margin:       0,
            whiteSpace:   'nowrap',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
          }}>
            {title}
          </h1>
          {subtitle && !isMobile && (
            <p style={{
              fontSize: '0.78rem',
              color:    'var(--lk-text-muted)',
              margin:   0,
            }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Droite — Actions */}
      <div style={{
        display:    'flex',
        alignItems: 'center',
        gap:        isMobile ? '8px' : '12px',
        flexShrink: 0,
      }}>

        {/* Slug agence — desktop seulement */}
        {!isMobile && slug && (
          <div style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '6px',
            background:   'var(--lk-dark-3)',
            border:       '1px solid var(--lk-border-2)',
            borderRadius: 'var(--radius-md)',
            padding:      '0.3rem 0.75rem',
            fontSize:     '0.78rem',
            color:        'var(--lk-text-secondary)',
            whiteSpace:   'nowrap',
          }}>
            <Settings size={12} style={{ color: 'var(--lk-amber)' }} />
            {slug}
          </div>
        )}

        {/* Notifications */}
        <NotificationBell />

        {/* Avatar & Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(prev => !prev)}
            aria-label="Menu utilisateur"
            style={{
              width:        36, height: 36,
              borderRadius: '50%',
              background:   'var(--lk-amber-bg-2)',
              border:       '1px solid rgba(212,168,83,0.3)',
              display:      'flex', alignItems: 'center', justifyContent: 'center',
              fontSize:     '0.78rem', fontWeight: 600,
              color:        'var(--lk-amber)', cursor: 'pointer',
              transition:   'transform 0.2s ease',
              transform:    showDropdown ? 'scale(0.92)' : 'scale(1)',
            }}
          >
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </button>

          {showDropdown && (
            <div style={{
              position:     'absolute',
              top:          'calc(100% + 8px)',
              right:        0,
              background:   'var(--lk-dark-2)',
              border:       '1px solid var(--lk-border)',
              borderRadius: 'var(--radius-md)',
              minWidth:     '200px',
              boxShadow:    '0 8px 32px rgba(0,0,0,0.5)',
              padding:      '0.5rem',
              zIndex:       200,
              animation:    'fadeIn 0.15s ease',
            }}>
              {/* Infos utilisateur */}
              <div style={{
                padding:      '0.5rem 0.5rem 0.75rem',
                borderBottom: '1px solid var(--lk-border)',
                marginBottom: '0.5rem',
              }}>
                <div style={{
                  fontSize:     '0.85rem',
                  fontWeight:   500,
                  color:        'var(--lk-text-primary)',
                  whiteSpace:   'nowrap',
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {user?.first_name} {user?.last_name}
                </div>
                <div style={{
                  fontSize:     '0.72rem',
                  color:        'var(--lk-text-muted)',
                  whiteSpace:   'nowrap',
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                  marginTop:    '2px',
                }}>
                  {user?.email}
                </div>
                {/* Slug sur mobile dans le dropdown */}
                {isMobile && slug && (
                  <div style={{
                    fontSize:     '0.7rem',
                    color:        'var(--lk-amber)',
                    marginTop:    '4px',
                    display:      'flex',
                    alignItems:   'center',
                    gap:          '4px',
                  }}>
                    <Settings size={10} />
                    {slug}
                  </div>
                )}
              </div>

              {/* Déconnexion */}
              <button
                onClick={() => {
                  setShowDropdown(false)
                  logout()
                }}
                style={{
                  width:        '100%',
                  display:      'flex', alignItems: 'center', gap: '8px',
                  background:   'transparent', border: 'none',
                  color:        'var(--lk-danger)',
                  padding:      '0.6rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor:       'pointer', fontSize: '0.85rem',
                  transition:   'background 0.15s',
                  textAlign:    'left',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <LogOut size={15} /> Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}