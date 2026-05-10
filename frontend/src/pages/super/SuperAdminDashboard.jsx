import { useEffect, useState } from 'react'
import SuperAdminLayout        from '../../components/super/SuperAdminLayout'
import { superAdminApi }       from '../../api/superAdminApi'
import { formatCurrency }      from '../../utils/formatCurrency'
import { Building2, CheckCircle2, PauseCircle, Users, Home, FileText, Wallet } from 'lucide-react'

function StatCard({ label, value, icon, color, delay = 0 }) {
  return (
    <div style={{
      background:   '#0e1219',
      border:       '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px',
      padding:      '1.25rem',
      position:     'relative',
      overflow:     'hidden',
      opacity:      0,
      animation:    `fadeIn 0.4s ease forwards ${delay}s`,
      transition:   'transform 0.2s, box-shadow 0.2s',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform  = 'translateY(-2px)'
      e.currentTarget.style.boxShadow  = '0 4px 20px rgba(0,0,0,0.4)'
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform  = 'none'
      e.currentTarget.style.boxShadow  = 'none'
    }}>
      {/* Barre top */}
      <div style={{
        position:   'absolute',
        top: 0, left: 0, right: 0,
        height:     '2px',
        background: `linear-gradient(90deg, ${color}, transparent)`,
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.72rem', color: '#8b8d96', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
        <div style={{
          width: 32, height: 32,
          borderRadius: '8px',
          background:   `${color}18`,
          display:      'flex',
          alignItems:   'center',
          justifyContent: 'center',
          fontSize:     '0.9rem',
        }}>
          {icon}
        </div>
      </div>
      <div style={{
        fontSize:   '1.75rem',
        fontFamily: 'var(--font-display)',
        fontWeight: 500,
        color:      '#f0ece4',
      }}>
        {value ?? '—'}
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div style={{
      background: '#0e1219', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px', padding: '1.25rem',
    }}>
      <div className="lk-skeleton" style={{ height: 12, width: '60%', marginBottom: '0.75rem' }} />
      <div className="lk-skeleton" style={{ height: 28, width: '40%' }} />
    </div>
  )
}

export default function SuperAdminDashboard() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    superAdminApi.stats()
      .then(res => setStats(res.data.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <SuperAdminLayout title="Dashboard" subtitle="Vue globale de la plateforme Lokimmo">

      {/* Stat cards */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap:                 '1rem',
        marginBottom:        '2rem',
      }}>
        {loading ? (
          [...Array(7)].map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard label="Agences totales"   value={stats?.total_agencies}    icon={<Building2 size={20} />} color="#5b9cf6" delay={0.05} />
            <StatCard label="Agences actives"   value={stats?.active_agencies}   icon={<CheckCircle2 size={20} />} color="#3ecf8e" delay={0.10} />
            <StatCard label="Agences inactives" value={stats?.inactive_agencies} icon={<PauseCircle size={20} />} color="#e5534b" delay={0.15} />
            <StatCard label="Utilisateurs"      value={stats?.total_users}       icon={<Users size={20} />} color="#d4a853" delay={0.20} />
            <StatCard label="Biens"             value={stats?.total_properties}  icon={<Home size={20} />} color="#5b9cf6" delay={0.25} />
            <StatCard label="Contrats actifs"   value={stats?.total_contracts}   icon={<FileText size={20} />} color="#3ecf8e" delay={0.30} />
            <StatCard label="Revenus annuels"   value={formatCurrency(stats?.annual_revenue)} icon={<Wallet size={20} />} color="#d4a853" delay={0.35} />
          </>
        )}
      </div>

      {/* Accès rapide */}
      <div style={{
        background:   '#0e1219',
        border:       '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px',
        padding:      '1.5rem',
        opacity:      0,
        animation:    'fadeIn 0.4s ease forwards 0.4s',
      }}>
        <h3 style={{
          fontFamily: 'var(--font-body)',
          fontSize:   '0.875rem',
          fontWeight: 500,
          color:      '#8b8d96',
          marginBottom: '1rem',
        }}>
          Accès rapide
        </h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { label: 'Gérer les agences', path: '/super/agencies', color: '#5b9cf6' },
          ].map(item => (
            <a key={item.path} href={item.path} style={{
              display:        'flex',
              alignItems:     'center',
              gap:            '6px',
              padding:        '0.5rem 1rem',
              background:     `${item.color}10`,
              border:         `1px solid ${item.color}25`,
              borderRadius:   '8px',
              color:          item.color,
              fontSize:       '0.875rem',
              textDecoration: 'none',
              transition:     'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = `${item.color}20`}
            onMouseLeave={e => e.currentTarget.style.background = `${item.color}10`}
            >
              {item.label} →
            </a>
          ))}
        </div>
      </div>
    </SuperAdminLayout>
  )
}