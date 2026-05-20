import { LayoutDashboard, Building2, FileText, CreditCard, LogOut, Shield, Menu, X } from 'lucide-react'
import { Link, useLocation }  from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useSuperAdmin }      from '../../context/SuperAdminContext'

export default function SuperAdminLayout({ title, subtitle, children }) {
  const { superAdmin, logout } = useSuperAdmin()
  const location               = useLocation()
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024
      setIsMobile(mobile)
      if (!mobile) setIsSidebarOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const navItems = [
    { path: '/super/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { path: '/super/agencies',  icon: <Building2       size={18} />, label: 'Agences' },
    { path: '/super/logs',      icon: <FileText        size={18} />, label: 'Logs' },
    { path: '/super/billing',   icon: <CreditCard      size={18} />, label: 'Facturation' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0a0c10', color: '#f0ece4', display: 'flex', position: 'relative' }}>

      {/* Overlay sur mobile quand la sidebar est ouverte */}
      {isMobile && isSidebarOpen && (
        <div 
          className="mobile-overlay" 
          onClick={() => setIsSidebarOpen(false)} 
          style={{ zIndex: 90 }}
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
        top: 0, 
        left: 0, 
        zIndex: 100,
        transform:     isMobile 
                         ? (isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)') 
                         : 'translateX(0)',
        transition:    'transform 0.3s ease',
      }}>
        {/* Logo */}
        <div style={{
          padding:      '1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display:      'flex', alignItems: 'center', gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '10px',
              background: 'rgba(212,168,83,0.15)',
              border:     '1px solid rgba(212,168,83,0.3)',
              display:    'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={18} color="#d4a853" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: '#d4a853' }}>
                Lokimmo
              </div>
              <div style={{ fontSize: '0.65rem', color: '#555761', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Super Admin
              </div>
            </div>
          </div>
          {isMobile && (
            <button 
              onClick={() => setIsSidebarOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#8b8d96',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
                marginLeft: 'auto',
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav style={{ padding: '1rem 0.75rem', flex: 1 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                onClick={() => {
                  if (isMobile) setIsSidebarOpen(false)
                }}
                style={{
                  display:        'flex', alignItems: 'center', gap: '10px',
                  padding:        '0.65rem 0.75rem',
                  borderRadius:   '8px', marginBottom: '2px',
                  textDecoration: 'none',
                  color:          isActive ? '#d4a853' : '#8b8d96',
                  background:     isActive ? 'rgba(212,168,83,0.1)' : 'transparent',
                  border:         `1px solid ${isActive ? 'rgba(212,168,83,0.15)' : 'transparent'}`,
                  fontSize:       '0.875rem', fontWeight: isActive ? 500 : 400,
                  transition:     'all 0.2s',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#f0ece4' }}}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8b8d96' }}}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(212,168,83,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 600, color: '#d4a853',
            }}>
              {superAdmin?.first_name?.[0]}{superAdmin?.last_name?.[0]}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 500, color: '#f0ece4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {superAdmin?.first_name} {superAdmin?.last_name}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#555761' }}>Super Admin</div>
            </div>
          </div>
          <button onClick={logout} style={{
            width:       '100%', padding: '0.5rem',
            background:  'rgba(229,83,75,0.08)',
            border:      '1px solid rgba(229,83,75,0.15)',
            borderRadius:'8px', color: '#e5534b',
            fontSize:    '0.8rem', cursor: 'pointer',
            display:     'flex', alignItems: 'center',
            justifyContent: 'center', gap: '6px',
          }}>
            <LogOut size={14} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ 
        marginLeft:    isMobile ? '0' : '220px', 
        flex:          1, 
        padding:       isMobile ? '1rem' : '2rem',
        transition:    'margin-left 0.3s ease',
        width:         '100%',
        overflowX:     'hidden',
      }}>
        {isMobile ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid rgba(255,255,255,0.06)'
          }}>
            <button
              onClick={() => setIsSidebarOpen(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f0ece4',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '0.5rem',
              }}
            >
              <Menu size={24} />
            </button>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
                {title}
              </h1>
              {subtitle && <p style={{ color: '#8b8d96', fontSize: '0.75rem', margin: 0 }}>{subtitle}</p>}
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, marginBottom: '4px' }}>
              {title}
            </h1>
            {subtitle && <p style={{ color: '#8b8d96', fontSize: '0.875rem' }}>{subtitle}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  )
}