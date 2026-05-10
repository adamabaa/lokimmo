import { useEffect, useState }   from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
         ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import DashboardLayout           from '../../components/layout/DashboardLayout'
import axiosInstance             from '../../api/axiosInstance'
import { formatCurrency }        from '../../utils/formatCurrency'
import {
  Home, CheckCircle, Key, FileText,
  AlertTriangle, TrendingUp, Users,
  Building2, Clock,
} from 'lucide-react'

const MONTHS_SHORT = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

function StatCard({ label, value, icon, color, delay = 0 }) {
  return (
    <div className="lk-stat-card" style={{
      opacity: 0,
      animation: `fadeIn 0.4s ease forwards ${delay}s`,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: '1rem',
      }}>
        <span style={{
          fontSize: '0.75rem', color: 'var(--lk-text-secondary)',
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          {label}
        </span>
        <div style={{
          width: 36, height: 36, borderRadius: 'var(--radius-md)',
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color,
        }}>
          {icon}
        </div>
      </div>
      <div style={{
        fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontWeight: 500,
      }}>
        {value ?? '—'}
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="lk-stat-card">
      <div className="lk-skeleton" style={{ height: 14, width: '60%', marginBottom: '1rem' }} />
      <div className="lk-skeleton" style={{ height: 28, width: '40%' }} />
    </div>
  )
}

function ChartCard({ title, children, delay = 0 }) {
  return (
    <div className="lk-card" style={{
      opacity: 0,
      animation: `fadeIn 0.4s ease forwards ${delay}s`,
    }}>
      <h3 style={{
        fontFamily: 'var(--font-body)', fontSize: '0.875rem',
        fontWeight: 500, color: 'var(--lk-text-secondary)',
        marginBottom: '1.25rem',
      }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function CustomTooltip({ active, payload, label, isCurrency = false }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--lk-dark-3)',
      border: '1px solid var(--lk-border-2)',
      borderRadius: 'var(--radius-md)',
      padding: '0.5rem 0.75rem', fontSize: '0.8rem',
    }}>
      <div style={{ color: 'var(--lk-text-secondary)', marginBottom: '4px' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 500 }}>
          {isCurrency ? formatCurrency(p.value) : p.value}
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axiosInstance.get('/api/dashboard/stats')
      .then(res => setStats(res.data.data))
      .finally(() => setLoading(false))
  }, [])

  // Revenus par mois depuis stats
  const revenueByMonth = () => {
    if (!Array.isArray(stats?.revenue_by_month)) return []
    return stats.revenue_by_month.map(item => ({
      name:    MONTHS_SHORT[(parseInt(item.month) || 1) - 1],
      revenus: parseFloat(item.total || 0),
    }))
  }

  const paymentStatus = () => [
    { name: 'Payé',       value: stats?.payment_counts?.paid    || 0, color: '#1D9E75' },
    { name: 'En attente', value: stats?.payment_counts?.pending  || 0, color: '#d4a853' },
    { name: 'En retard',  value: stats?.payment_counts?.late     || 0, color: '#e5534b' },
    { name: 'Partiel',    value: stats?.payment_counts?.partial  || 0, color: '#5b9cf6' },
  ]

  const propertyStatus = () => [
    { name: 'Loués',       value: parseInt(stats?.properties?.rented      || 0), color: '#5b9cf6' },
    { name: 'Disponibles', value: parseInt(stats?.properties?.available   || 0), color: '#1D9E75' },
    { name: 'Maintenance', value: parseInt(stats?.properties?.maintenance || 0), color: '#d4a853' },
  ].filter(d => d.value > 0)

  return (
    <DashboardLayout title="Dashboard" subtitle="Vue d'ensemble de votre activité">

      {/* Stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem', marginBottom: '2rem',
      }}>
        {loading ? (
          [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard label="Biens total"
              value={stats?.properties?.total}
              icon={<Home size={18} />}
              color="#d4a853" delay={0.05} />
            <StatCard label="Biens disponibles"
              value={stats?.properties?.available}
              icon={<CheckCircle size={18} />}
              color="#3ecf8e" delay={0.10} />
            <StatCard label="Biens loués"
              value={stats?.properties?.rented}
              icon={<Key size={18} />}
              color="#5b9cf6" delay={0.15} />
            <StatCard label="Contrats actifs"
              value={stats?.active_contracts}
              icon={<FileText size={18} />}
              color="#d4a853" delay={0.20} />
            <StatCard label="Loyers en retard"
              value={stats?.late_payments}
              icon={<AlertTriangle size={18} />}
              color="#e5534b" delay={0.25} />
            <StatCard
              label={stats?.revenue_period || 'Revenus du mois'}
              value={formatCurrency(stats?.monthly_revenue)}
              icon={<TrendingUp size={18} />}
              color="#3ecf8e" delay={0.30} />
          </>
        )}
      </div>

      {/* Graphiques ligne 1 */}
      <div style={{
        display: 'grid', gridTemplateColumns: '2fr 1fr',
        gap: '1rem', marginBottom: '1rem',
      }}>
        <ChartCard title="Revenus encaissés (8 derniers mois)" delay={0.35}>
          {loading ? (
            <div className="lk-skeleton" style={{ height: 220 }} />
          ) : revenueByMonth().length === 0 ? (
            <div style={{
              height: 220, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'var(--lk-text-muted)',
              fontSize: '0.875rem', flexDirection: 'column', gap: '8px',
            }}>
              <TrendingUp size={32} style={{ opacity: 0.2 }} />
              Aucune donnée de revenus
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueByMonth()} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--lk-border)" />
                <XAxis dataKey="name"
                  tick={{ fill: 'var(--lk-text-muted)', fontSize: 11 }}
                  axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: 'var(--lk-text-muted)', fontSize: 10 }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M`
                    : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip content={<CustomTooltip isCurrency />} />
                <Bar dataKey="revenus" fill="var(--lk-amber)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Occupation des biens" delay={0.40}>
          {loading ? (
            <div className="lk-skeleton" style={{ height: 220 }} />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={propertyStatus()} cx="50%" cy="50%"
                  outerRadius={75} labelLine={false} dataKey="value">
                  {propertyStatus().map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
                <Legend
                  iconType="circle" iconSize={8}
                  formatter={v => (
                    <span style={{ fontSize: '0.75rem', color: 'var(--lk-text-secondary)' }}>
                      {v}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Graphiques ligne 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

        <ChartCard title="Répartition des paiements" delay={0.45}>
          {loading ? (
            <div className="lk-skeleton" style={{ height: 200 }} />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={paymentStatus()} cx="50%" cy="50%"
                  outerRadius={75} paddingAngle={3} dataKey="value"
                  label={({ percent }) =>
                    percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
                  }
                  labelLine={false}
                >
                  {paymentStatus().map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  iconType="circle" iconSize={8}
                  formatter={v => (
                    <span style={{ fontSize: '0.75rem', color: 'var(--lk-text-secondary)' }}>
                      {v}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Indicateurs clés" delay={0.50}>
          {loading ? (
            <div className="lk-skeleton" style={{ height: 200 }} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.5rem' }}>

              {/* Taux occupation */}
              {(() => {
                const total  = parseInt(stats?.properties?.total  || 0)
                const rented = parseInt(stats?.properties?.rented || 0)
                const rate   = total > 0 ? Math.round((rented / total) * 100) : 0
                return (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--lk-text-secondary)' }}>
                        Taux d'occupation
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--lk-amber)' }}>
                        {rate}%
                      </span>
                    </div>
                    <div style={{ height: 6, background: 'var(--lk-dark-4)', borderRadius: 3 }}>
                      <div style={{
                        height: 6, borderRadius: 3, width: `${rate}%`,
                        background: 'linear-gradient(90deg, var(--lk-amber-dark), var(--lk-amber-light))',
                        transition: 'width 1s ease',
                      }} />
                    </div>
                  </div>
                )
              })()}

              {[
                { label: 'Propriétaires',  value: stats?.owners           || 0, color: '#d4a853', icon: <Building2  size={14} /> },
                { label: 'Locataires',     value: stats?.tenants          || 0, color: '#5b9cf6', icon: <Users      size={14} /> },
                { label: 'Contrats actifs',value: stats?.active_contracts || 0, color: '#3ecf8e', icon: <FileText   size={14} /> },
                { label: 'Loyers retard',  value: stats?.late_payments    || 0, color: '#e5534b', icon: <AlertTriangle size={14} /> },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: item.color }}>{item.icon}</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--lk-text-secondary)' }}>
                      {item.label}
                    </span>
                  </div>
                  <span style={{
                    fontWeight: 500,
                    color: item.label === 'Loyers retard' && item.value > 0
                      ? '#e5534b' : 'inherit',
                  }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>
    </DashboardLayout>
  )
}