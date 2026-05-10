import { useEffect, useState }  from 'react'
import DashboardLayout           from '../../components/layout/DashboardLayout'
import { billingApi }            from '../../api/billingApi'
import { formatCurrency }        from '../../utils/formatCurrency'
import { formatDate }            from '../../utils/formatDate'
import Spinner                   from '../../components/ui/Spinner'
import {
  CreditCard, Check, AlertTriangle,
  Gift, Clock, MessageCircle,
  Receipt, TrendingUp,
} from 'lucide-react'

const PLAN_COLORS = {
  free:    '#8b8d96',
  starter: '#5b9cf6',
  pro:     '#d4a853',
}

const STATUS_LABELS = {
  draft:     { label: 'Brouillon',  color: '#8b8d96' },
  sent:      { label: 'En attente', color: '#d4a853' },
  paid:      { label: 'Payée',      color: '#3ecf8e' },
  overdue:   { label: 'En retard',  color: '#e5534b' },
  cancelled: { label: 'Annulée',    color: '#8b8d96' },
}

export default function BillingPage() {
  const [data,     setData]     = useState(null)
  const [invoices, setInvoices] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      billingApi.getCurrentPlan(),
      billingApi.getInvoices(),
    ]).then(([planRes, invRes]) => {
      setData(planRes.data.data)
      const raw = invRes.data?.data
      setInvoices(Array.isArray(raw) ? raw : raw?.data || [])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <DashboardLayout title="Facturation" subtitle="Votre abonnement Lokimmo">
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <Spinner size="lg" />
      </div>
    </DashboardLayout>
  )

  const plan      = data?.current_plan
  const usage     = data?.usage
  const plans     = data?.plans || []
  const planColor = PLAN_COLORS[plan?.plan_slug] || '#8b8d96'

  const daysLeft = plan?.expires_at
    ? Math.max(0, Math.ceil((new Date(plan.expires_at) - new Date()) / 86400000))
    : null

  const getStatusIcon = (status) => {
    if (status === 'active') return <><Check size={10} /> Actif</>
    if (status === 'trial')  return <><Gift  size={10} /> Période d'essai</>
    return <><AlertTriangle size={10} /> Expiré</>
  }

  return (
    <DashboardLayout title="Facturation" subtitle="Votre abonnement Lokimmo">

      {/* Plan actuel */}
      <div style={{
        background:   'var(--lk-dark-2)',
        border:       `1px solid ${planColor}30`,
        borderRadius: 'var(--radius-lg)',
        padding:      '1.5rem',
        marginBottom: '1.5rem',
        position:     'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${planColor}, transparent)`,
        }} />

        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
              <span style={{
                fontSize: '0.72rem', fontWeight: 600,
                color: planColor, background: `${planColor}15`,
                border: `1px solid ${planColor}30`,
                borderRadius: '20px', padding: '3px 12px',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                {plan?.plan_name || 'Free'}
              </span>
              <span style={{
                fontSize: '0.72rem',
                color:      plan?.status === 'active' ? '#3ecf8e' : plan?.status === 'trial' ? '#d4a853' : '#e5534b',
                background: plan?.status === 'active' ? 'rgba(62,207,142,0.1)' : plan?.status === 'trial' ? 'rgba(212,168,83,0.1)' : 'rgba(229,83,75,0.1)',
                borderRadius: '20px', padding: '3px 10px',
                display: 'inline-flex', alignItems: 'center', gap: '4px',
              }}>
                {getStatusIcon(plan?.status)}
              </span>
            </div>

            <div style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '4px' }}>
              {formatCurrency(plan?.price || 0)}
              <span style={{ fontSize: '1rem', color: 'var(--lk-text-muted)', fontWeight: 400 }}>/mois</span>
            </div>

            {daysLeft !== null && (
              <div style={{
                fontSize: '0.8rem',
                color: daysLeft < 7 ? '#e5534b' : 'var(--lk-text-muted)',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                {daysLeft < 7 && <AlertTriangle size={12} />}
                {daysLeft === 0 ? 'Expiré' : `Expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`}
                {plan?.expires_at && ` (${formatDate(plan.expires_at)})`}
              </div>
            )}

            {plan?.status === 'trial' && plan?.trial_ends_at && (
              <div style={{ fontSize: '0.8rem', color: '#d4a853', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Gift size={12} /> Essai gratuit jusqu'au {formatDate(plan.trial_ends_at)}
              </div>
            )}
          </div>

          <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--lk-text-muted)' }}>
            Contactez le support pour changer de plan
          </div>
        </div>

        {/* Utilisation */}
        {usage && (
          <div style={{
            marginTop: '1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
          }}>
            {[
              { label: 'Biens',         used: usage.properties.used, max: usage.properties.max },
              { label: 'Locataires',    used: usage.tenants.used,    max: usage.tenants.max },
              { label: 'Agents',        used: usage.users.used,      max: usage.users.max },
              { label: 'Propriétaires', used: usage.owners.used,     max: usage.owners.max },
            ].map((item, i) => {
              const pct     = item.max >= 999999 ? 0 : Math.round((item.used / item.max) * 100)
              const isLimit = item.max < 999999 && item.used >= item.max
              return (
                <div key={i} style={{
                  background: 'var(--lk-dark-3)',
                  borderRadius: 'var(--radius-md)', padding: '0.75rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--lk-text-muted)' }}>{item.label}</span>
                    <span style={{ color: isLimit ? '#e5534b' : 'var(--lk-text-primary)', fontWeight: 500 }}>
                      {item.used} / {item.max >= 999999 ? '∞' : item.max}
                    </span>
                  </div>
                  {item.max < 999999 && (
                    <div style={{ height: 4, background: 'var(--lk-dark-4)', borderRadius: 2 }}>
                      <div style={{
                        height: 4, borderRadius: 2,
                        width: `${Math.min(100, pct)}%`,
                        background: isLimit ? '#e5534b' : pct > 75 ? '#d4a853' : '#3ecf8e',
                        transition: 'width 0.8s ease',
                      }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Plans disponibles */}
      <h3 style={{
        fontSize: '0.875rem', fontWeight: 500,
        color: 'var(--lk-text-secondary)', marginBottom: '1rem',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <CreditCard size={15} /> Nos plans
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem', marginBottom: '2rem',
      }}>
        {plans.map((p, i) => {
          const isActive = p.slug === plan?.plan_slug
          const color    = PLAN_COLORS[p.slug] || '#8b8d96'
          let features   = []
          try { features = JSON.parse(p.features || '[]') } catch { features = [] }

          return (
            <div key={i} style={{
              background:   isActive ? `${color}08` : 'var(--lk-dark-2)',
              border:       `1px solid ${isActive ? color : 'var(--lk-border)'}`,
              borderRadius: 'var(--radius-lg)', padding: '1.5rem',
              position:     'relative', overflow: 'hidden',
            }}>
              {isActive && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0,
                  height: '3px', background: color,
                }} />
              )}

              <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '4px', color }}>
                {p.name}
              </div>
              <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1rem' }}>
                {p.price === 0 ? 'Gratuit' : formatCurrency(p.price)}
                {p.price > 0 && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--lk-text-muted)', fontWeight: 400 }}>/mois</span>
                )}
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--lk-text-muted)', marginBottom: '1rem' }}>
                {p.max_properties >= 999999 ? '∞' : p.max_properties} biens •{' '}
                {p.max_users >= 999999 ? '∞' : p.max_users} agents •{' '}
                {p.max_tenants >= 999999 ? '∞' : p.max_tenants} locataires
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {features.map((f, j) => (
                  <div key={j} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '0.8rem', color: 'var(--lk-text-secondary)',
                  }}>
                    <Check size={12} color="#3ecf8e" style={{ flexShrink: 0 }} />
                    {f}
                  </div>
                ))}
              </div>

              {isActive && (
                <div style={{
                  marginTop: '1rem', textAlign: 'center',
                  fontSize: '0.75rem', color,
                  fontWeight: 500, padding: '4px',
                  background: `${color}10`,
                  borderRadius: 'var(--radius-md)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                }}>
                  <Check size={12} /> Plan actuel
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Factures */}
      <h3 style={{
        fontSize: '0.875rem', fontWeight: 500,
        color: 'var(--lk-text-secondary)', marginBottom: '1rem',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <Receipt size={15} /> Historique des factures
      </h3>
      <div style={{
        background: 'var(--lk-dark-2)',
        border: '1px solid var(--lk-border)',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      }}>
        {invoices.length === 0 ? (
          <div style={{
            padding: '3rem', textAlign: 'center',
            color: 'var(--lk-text-muted)', fontSize: '0.875rem',
          }}>
            <Receipt size={32} style={{ opacity: 0.2, marginBottom: '0.5rem', display: 'block', margin: '0 auto 0.5rem' }} />
            Aucune facture pour le moment
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: 'var(--lk-dark-3)', borderBottom: '1px solid var(--lk-border)' }}>
                {['N° Facture', 'Plan', 'Montant', 'Période', 'Échéance', 'Statut'].map(h => (
                  <th key={h} style={{
                    padding: '0.75rem 1rem', textAlign: 'left',
                    fontSize: '0.68rem', color: 'var(--lk-text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => (
                <tr key={i}
                  style={{ borderBottom: '1px solid var(--lk-border)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--lk-dark-3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: 'var(--lk-amber)' }}>
                    {inv.invoice_number}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{
                      color:        PLAN_COLORS[inv.plan_slug],
                      background:   `${PLAN_COLORS[inv.plan_slug]}15`,
                      borderRadius: '20px', padding: '2px 8px', fontSize: '0.72rem',
                    }}>
                      {inv.plan_name}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 500 }}>
                    {formatCurrency(inv.amount)}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--lk-text-muted)', fontSize: '0.75rem' }}>
                    {formatDate(inv.period_start)} → {formatDate(inv.period_end)}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--lk-text-muted)', fontSize: '0.75rem' }}>
                    {formatDate(inv.due_date)}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{
                      color:        STATUS_LABELS[inv.status]?.color,
                      background:   `${STATUS_LABELS[inv.status]?.color}15`,
                      borderRadius: '20px', padding: '2px 10px',
                      fontSize: '0.72rem', fontWeight: 500,
                    }}>
                      {STATUS_LABELS[inv.status]?.label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Contact */}
      <div style={{
        marginTop:    '1.5rem',
        padding:      '1rem 1.25rem',
        background:   'var(--lk-amber-bg)',
        border:       '1px solid rgba(212,168,83,0.2)',
        borderRadius: 'var(--radius-md)',
        fontSize:     '0.875rem',
        color:        'var(--lk-text-secondary)',
        display:      'flex',
        alignItems:   'center',
        gap:          '10px',
      }}>
        <MessageCircle size={16} color="var(--lk-amber)" style={{ flexShrink: 0 }} />
        <span>
          Pour changer de plan ou toute question sur votre abonnement,
          contactez-nous à{' '}
          <a href="mailto:billing@lokimmo.com" style={{ color: 'var(--lk-amber)' }}>
            billing@lokimmo.com
          </a>
        </span>
      </div>

    </DashboardLayout>
  )
}