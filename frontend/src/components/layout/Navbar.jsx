import { Settings, LogOut } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuth }                      from '../../context/AuthContext'
import NotificationBell                 from '../ui/NotificationBell'

export default function Navbar({ title, subtitle }) {
  const { user, logout } = useAuth()
  const slug     = localStorage.getItem('lk_slug') || ''
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

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
      height:              'var(--navbar-height)',
      background:          'rgba(15,17,23,0.8)',
      backdropFilter:      'blur(12px)',
      WebkitBackdropFilter:'blur(12px)',
      borderBottom:        '1px solid var(--lk-border)',
      display:             'flex',
      alignItems:          'center',
      justifyContent:      'space-between',
      padding:             '0 2rem',
      position:            'sticky',
      top:                 0,
      zIndex:              50,
      animation:           'fadeIn 0.4s ease',
    }}>
      <div>
        <h1 className="lk-page-title" style={{ fontSize: '1.2rem' }}>{title}</h1>
        {subtitle && (
          <p className="lk-page-subtitle" style={{ fontSize: '0.8rem' }}>{subtitle}</p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        {/* Indicateur agence */}
        <div style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '6px',
          background:   'var(--lk-dark-3)',
          border:       '1px solid var(--lk-border-2)',
          borderRadius: 'var(--radius-md)',
          padding:      '0.35rem 0.85rem',
          fontSize:     '0.8rem',
          color:        'var(--lk-text-secondary)',
        }}>
          <Settings size={13} style={{ color: 'var(--lk-amber)' }} />
          {slug}
        </div>

        {/* Cloche notifications */}
        <NotificationBell />

        {/* Avatar & Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <div 
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              width:          36, height: 36,
              borderRadius:   '50%',
              background:     'var(--lk-amber-bg-2)',
              border:         '1px solid rgba(212,168,83,0.3)',
              display:        'flex', alignItems: 'center', justifyContent: 'center',
              fontSize:       '0.8rem', fontWeight: 600,
              color:          'var(--lk-amber)', cursor: 'pointer',
              transition:     'all 0.2s ease',
              transform:      showDropdown ? 'scale(0.95)' : 'scale(1)'
            }}>
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>

          {showDropdown && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 10px)', right: 0,
              background: 'var(--lk-dark-2)',
              border: '1px solid var(--lk-border)',
              borderRadius: 'var(--radius-md)',
              minWidth: '200px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              padding: '0.5rem',
              zIndex: 100,
              animation: 'fadeIn 0.2s ease',
            }}>
              <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--lk-border)', marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--lk-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.first_name} {user?.last_name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--lk-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.email}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDropdown(false);
                  logout();
                }}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'transparent', border: 'none',
                  color: 'var(--lk-danger)',
                  padding: '0.6rem 0.5rem', borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer', fontSize: '0.85rem',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <LogOut size={16} /> Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}