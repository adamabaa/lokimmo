import { LayoutDashboard, Building2, FileText, CreditCard, LogOut, Shield } from 'lucide-react'
import { Link, useLocation }  from 'react-router-dom'
import { useSuperAdmin }      from '../../context/SuperAdminContext'

export default function SuperAdminLayout({ title, subtitle, children }) {
  const { superAdmin, logout } = useSuperAdmin()
  const location               = useLocation()

  const navItems = [
    { path: '/super/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { path: '/super/agencies',  icon: <Building2       size={18} />, label: 'Agences' },
    { path: '/super/logs',      icon: <FileText        size={18} />, label: 'Logs' },
    { path: '/super/billing',   icon: <CreditCard      size={18} />, label: 'Facturation' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0a0c10', color: '#f0ece4', display: 'flex' }}>

      {/* Sidebar */}
      <aside style={{
        width:         '220px', minHeight: '100vh',
        background:    '#0e1219',
        borderRight:   '1px solid rgba(255,255,255,0.06)',
        display:       'flex', flexDirection: 'column',
        position:      'fixed', top: 0, left: 0, zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{
          padding:      '1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display:      'flex', alignItems: 'center', gap: '10px',
        }}>
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

        {/* Nav */}
        <nav style={{ padding: '1rem 0.75rem', flex: 1 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path} style={{
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
      <main style={{ marginLeft: '220px', flex: 1, padding: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 600, marginBottom: '4px' }}>
            {title}
          </h1>
          {subtitle && <p style={{ color: '#8b8d96', fontSize: '0.875rem' }}>{subtitle}</p>}
        </div>
        {children}
      </main>
    </div>
  )
}