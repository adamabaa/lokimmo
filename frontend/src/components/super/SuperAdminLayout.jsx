import { LayoutDashboard, Building2, FileText, CreditCard, LogOut, Shield, Menu, X } from 'lucide-react'
import { Link, useLocation }  from 'react-router-dom'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useSuperAdmin }      from '../../context/SuperAdminContext'

export default function SuperAdminLayout({ title, subtitle, children }) {
  const { superAdmin, logout } = useSuperAdmin()
  const location               = useLocation()

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile]           = useState(window.innerWidth <= 1024)

  // Utiliser useRef pour suivre le chemin précédent
  const prevPathname = useRef(location.pathname)

  // Gérer la fermeture de la sidebar quand la route change (uniquement sur mobile)
  // Utiliser un effet séparé qui ne fait que mettre à jour la référence
  useEffect(() => {
    prevPathname.current = location.pathname
  }, [location.pathname])

  // Effet séparé pour fermer la sidebar - utilise un callback pour éviter l'avertissement
  useEffect(() => {
    // Utiliser setTimeout pour sortir du contexte de rendu React
    const timeoutId = setTimeout(() => {
      if (isMobile && isSidebarOpen) {
        setIsSidebarOpen(false)
      }
    }, 0)
    
    return () => clearTimeout(timeoutId)
  }, [location.pathname, isMobile, isSidebarOpen])

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024
      setIsMobile(mobile)
      if (!mobile) setIsSidebarOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Bloquer scroll body quand sidebar ouverte
  useEffect(() => {
    document.body.style.overflow = (isMobile && isSidebarOpen) ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isMobile, isSidebarOpen])

  const closeSidebar = useCallback(() => setIsSidebarOpen(false), [])
  const openSidebar  = useCallback(() => setIsSidebarOpen(true), [])

  const navItems = [
    { path: '/super/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { path: '/super/agencies',  icon: <Building2       size={18} />, label: 'Agences' },
    { path: '/super/logs',      icon: <FileText        size={18} />, label: 'Logs' },
    { path: '/super/billing',   icon: <CreditCard      size={18} />, label: 'Facturation' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0a0c10', color: '#f0ece4', display: 'flex', position: 'relative' }}>

      {/* Overlay mobile */}
      {isMobile && isSidebarOpen && (
        <div
          onClick={closeSidebar}
          style={{
            position:   'fixed',
            inset:      0,
            background: 'rgba(0,0,0,0.65)',
            zIndex:     99,
            backdropFilter: 'blur(2px)',
            animation:  'fadeIn 0.2s ease',
          }}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width:         '220px',
        height:        '100vh',
        background:    '#0e1219',
        borderRight:   '1px solid rgba(255,255,255,0.06)',
        display:       'flex',
        flexDirection: 'column',
        position:      'fixed',
        top: 0, left: 0,
        zIndex:        100,
        transform:     isMobile
                         ? (isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)')
                         : 'translateX(0)',
        transition:    'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        overflowY:     'auto',
      }}>

        {/* Header sidebar */}
        <div style={{
          padding:        '1.25rem 1rem',
          borderBottom:   '1px solid rgba(255,255,255,0.06)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          flexShrink:     0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '10px', flexShrink: 0,
              background: 'rgba(212,168,83,0.15)',
              border:     '1px solid rgba(212,168,83,0.3)',
              display:    'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={16} color="#d4a853" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: '1rem',
                fontWeight: 600, color: '#d4a853',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                Lokimmo
              </div>
              <div style={{ fontSize: '0.62rem', color: '#555761', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Super Admin
              </div>
            </div>
          </div>

          {/* Bouton fermeture mobile */}
          {isMobile && (
            <button
              onClick={closeSidebar}
              aria-label="Fermer le menu"
              style={{
                background:     'rgba(255,255,255,0.06)',
                border:         '1px solid rgba(255,255,255,0.1)',
                borderRadius:   '6px',
                color:          '#8b8d96',
                cursor:         'pointer',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                width: 30, height: 30,
                flexShrink:     0,
                marginLeft:     '8px',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ padding: '0.75rem', flex: 1 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                style={{
                  display:        'flex', alignItems: 'center', gap: '10px',
                  padding:        '0.7rem 0.75rem',
                  borderRadius:   '8px', marginBottom: '2px',
                  textDecoration: 'none',
                  color:          isActive ? '#d4a853' : '#8b8d96',
                  background:     isActive ? 'rgba(212,168,83,0.1)' : 'transparent',
                  border:         `1px solid ${isActive ? 'rgba(212,168,83,0.15)' : 'transparent'}`,
                  fontSize:       '0.875rem', fontWeight: isActive ? 500 : 400,
                  transition:     'all 0.15s',
                  whiteSpace:     'nowrap',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#f0ece4' }}}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8b8d96' }}}
              >
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User + Déconnexion */}
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(212,168,83,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 600, color: '#d4a853',
            }}>
              {superAdmin?.first_name?.[0]}{superAdmin?.last_name?.[0]}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: '0.8rem', fontWeight: 500, color: '#f0ece4',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {superAdmin?.first_name} {superAdmin?.last_name}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#555761' }}>Super Admin</div>
            </div>
          </div>
          <button onClick={logout} style={{
            width:          '100%', padding: '0.5rem',
            background:     'rgba(229,83,75,0.08)',
            border:         '1px solid rgba(229,83,75,0.15)',
            borderRadius:   '8px', color: '#e5534b',
            fontSize:       '0.8rem', cursor: 'pointer',
            display:        'flex', alignItems: 'center',
            justifyContent: 'center', gap: '6px',
            transition:     'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(229,83,75,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(229,83,75,0.08)'}
          >
            <LogOut size={14} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <main style={{
        marginLeft: isMobile ? '0' : '220px',
        flex:       1,
        display:    'flex',
        flexDirection: 'column',
        minHeight:  '100vh',
        transition: 'margin-left 0.3s ease',
        width:      isMobile ? '100%' : 'calc(100% - 220px)',
        overflowX:  'hidden',
      }}>

        {/* Header top */}
        <div style={{
          padding:        isMobile ? '0.875rem 1rem' : '1.25rem 2rem',
          borderBottom:   '1px solid rgba(255,255,255,0.06)',
          display:        'flex',
          alignItems:     'center',
          gap:            '12px',
          background:     'rgba(14,18,25,0.8)',
          backdropFilter: 'blur(12px)',
          position:       'sticky',
          top:            0,
          zIndex:         50,
          flexShrink:     0,
        }}>
          {/* Hamburger mobile */}
          {isMobile && (
            <button
              onClick={openSidebar}
              aria-label="Ouvrir le menu"
              style={{
                background:     'rgba(255,255,255,0.06)',
                border:         '1px solid rgba(255,255,255,0.1)',
                borderRadius:   '8px',
                color:          '#f0ece4',
                cursor:         'pointer',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                width: 36, height: 36,
                flexShrink:     0,
              }}
            >
              <Menu size={20} />
            </button>
          )}

          <div style={{ minWidth: 0 }}>
            <h1 style={{
              fontFamily:   'var(--font-display)',
              fontSize:     isMobile ? '1rem' : '1.35rem',
              fontWeight:   600,
              margin:       0,
              whiteSpace:   'nowrap',
              overflow:     'hidden',
              textOverflow: 'ellipsis',
            }}>
              {title}
            </h1>
            {subtitle && !isMobile && (
              <p style={{ color: '#8b8d96', fontSize: '0.8rem', margin: 0 }}>{subtitle}</p>
            )}
          </div>

          {/* Badge Super Admin desktop */}
          {!isMobile && (
            <div style={{
              marginLeft:   'auto',
              display:      'flex', alignItems: 'center', gap: '6px',
              background:   'rgba(212,168,83,0.08)',
              border:       '1px solid rgba(212,168,83,0.2)',
              borderRadius: '20px',
              padding:      '0.3rem 0.85rem',
              fontSize:     '0.75rem', color: '#d4a853',
              whiteSpace:   'nowrap',
            }}>
              <Shield size={12} /> Super Admin
            </div>
          )}
        </div>

        {/* Page content */}
        <div style={{
          padding:  isMobile ? '0.875rem' : '2rem',
          flex:     1,
          maxWidth: '100%',
        }}>
          {children}
        </div>
      </main>
    </div>
  )
}