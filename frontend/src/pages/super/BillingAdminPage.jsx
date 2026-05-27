import { useEffect, useState, useCallback } from 'react'
import SuperAdminLayout from '../../components/super/SuperAdminLayout'
import { billingApi }   from '../../api/billingApi'
import { formatCurrency } from '../../utils/formatCurrency'
import { formatDate }     from '../../utils/formatDate'
import Spinner            from '../../components/ui/Spinner'
import { useToast }       from '../../context/ToastContext'
import { Wallet, Hourglass, Receipt } from 'lucide-react'

const STATUS_LABELS = {
  draft:     { label: 'Brouillon',  color: '#8b8d96' },
  sent:      { label: 'En attente', color: '#d4a853' },
  paid:      { label: 'Payée',      color: '#3ecf8e' },
  overdue:   { label: 'En retard',  color: '#e5534b' },
  cancelled: { label: 'Annulée',    color: '#8b8d96' },
}

export default function BillingAdminPage() {
  const { show }    = useToast()
  const [stats,     setStats]       = useState(null)
  const [invoices,  setInvoices]    = useState([])
  const [loading,   setLoading]     = useState(true)
  const [page,      setPage]        = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [marking,   setMarking]     = useState(null)
  const [isMobile,  setIsMobile]    = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, invRes] = await Promise.all([
        billingApi.getBillingStats(),
        billingApi.getAllInvoices({ page, status: statusFilter }),
      ])
      setStats(statsRes.data.data)
      setInvoices(invRes.data.data?.invoices || [])
      setTotalPages(invRes.data.data?.total_pages || 1)
    } finally { setLoading(false) }
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])

  const markPaid = async (id) => {
    setMarking(id)
    try {
      await billingApi.markInvoicePaid(id, { payment_method: 'cash' })
      show('Facture marquée comme payée', 'success')
      load()
    } catch {
      show('Erreur', 'error')
    } finally { setMarking(null) }
  }

  return (
    <SuperAdminLayout title="Facturation" subtitle="Gestion des abonnements et factures">

      {/* Stats */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}>
          {[
            { label: 'Revenus totaux',    value: formatCurrency(stats.total_revenue),  color: '#3ecf8e', icon: <Wallet size={18} /> },
            { label: 'En attente',        value: formatCurrency(stats.pending_amount), color: '#d4a853', icon: <Hourglass size={18} /> },
            { label: 'Factures impayées', value: stats.pending_count,                  color: '#e5534b', icon: <Receipt size={18} /> },
          ].map((card, i) => (
            <div key={i} style={{
              background: '#0e1219',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px', padding: '1rem',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${card.color}, transparent)` }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.68rem', color: '#8b8d96', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{card.label}</span>
                <span style={{ color: card.color }}>{card.icon}</span>
              </div>
              <div style={{ fontSize: isMobile ? '1.1rem' : '1.4rem', fontFamily: 'var(--font-display)', color: '#f0ece4', fontWeight: 500 }}>
                {card.value}
              </div>
            </div>
          ))}
          {stats.by_plan?.map((p, i) => (
            <div key={i} style={{
              background: '#0e1219',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px', padding: '1rem',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, #5b9cf6, transparent)' }} />
              <div style={{ fontSize: '0.68rem', color: '#8b8d96', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                Plan {p.name}
              </div>
              <div style={{ fontSize: isMobile ? '1.1rem' : '1.4rem', fontFamily: 'var(--font-display)', color: '#f0ece4', fontWeight: 500 }}>
                {p.count} <span style={{ fontSize: '0.8rem', color: '#8b8d96', fontWeight: 400 }}>agences</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filtre */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', alignItems: 'center' }}>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          style={{
            background: '#0e1219', color: '#f0ece4',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '8px', padding: '0.5rem 0.75rem',
            fontSize: '0.875rem', flex: isMobile ? 1 : 'none',
          }}
        >
          <option value="">Toutes les factures</option>
          <option value="sent">En attente</option>
          <option value="paid">Payées</option>
          <option value="overdue">En retard</option>
        </select>
      </div>

      {/* Contenu */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Spinner size="md" />
        </div>
      ) : isMobile ? (
        <div>
          {invoices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#8b8d96' }}>Aucune facture</div>
          ) : invoices.map((inv, i) => {
            const status = STATUS_LABELS[inv.status] || { label: inv.status, color: '#8b8d96' }
            return (
              <div key={i} style={{
                background: '#0e1219',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px', padding: '1rem',
                marginBottom: '0.75rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontFamily: 'monospace', color: '#d4a853', fontSize: '0.82rem', marginBottom: '2px' }}>{inv.invoice_number}</div>
                    <div style={{ fontWeight: 600, color: '#f0ece4' }}>{inv.agency_name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#555761', fontFamily: 'monospace' }}>{inv.agency_slug}</div>
                  </div>
                  <span style={{
                    color: status.color, background: `${status.color}15`,
                    borderRadius: '20px', padding: '2px 10px',
                    fontSize: '0.72rem', fontWeight: 500, whiteSpace: 'nowrap',
                  }}>{status.label}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {[
                    { label: 'Plan',     value: inv.plan_name || '—', style: { color: '#8b8d96' } },
                    { label: 'Montant',  value: formatCurrency(inv.amount), style: { color: '#f0ece4', fontWeight: 600 } },
                    { label: 'Échéance', value: formatDate(inv.due_date), style: { color: '#8b8d96' } },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ fontSize: '0.65rem', color: '#555761', textTransform: 'uppercase', marginBottom: '2px' }}>{item.label}</div>
                      <div style={{ fontSize: '0.85rem', ...item.style }}>{item.value}</div>
                    </div>
                  ))}
                </div>
                {['sent', 'overdue'].includes(inv.status) && (
                  <button onClick={() => markPaid(inv.id)} disabled={marking === inv.id} style={{
                    width: '100%', padding: '0.5rem',
                    background: 'rgba(62,207,142,0.1)', border: '1px solid rgba(62,207,142,0.2)',
                    borderRadius: '8px', color: '#3ecf8e',
                    fontSize: '0.85rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  }}>
                    {marking === inv.id ? <Spinner size="sm" /> : '✓ Marquer payée'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ background: '#0e1219', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '650px' }}>
              <thead>
                <tr style={{ background: '#13171f', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['N° Facture', 'Agence', 'Plan', 'Montant', 'Échéance', 'Statut', ''].map(h => (
                    <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.68rem', color: '#555761', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => (
                  <tr key={i}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: '#d4a853' }}>{inv.invoice_number}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ color: '#f0ece4', fontWeight: 500 }}>{inv.agency_name}</div>
                      <div style={{ color: '#555761', fontSize: '0.72rem', fontFamily: 'monospace' }}>{inv.agency_slug}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#8b8d96' }}>{inv.plan_name}</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 500, color: '#f0ece4' }}>{formatCurrency(inv.amount)}</td>
                    <td style={{ padding: '0.85rem 1rem', color: '#8b8d96', fontSize: '0.75rem' }}>{formatDate(inv.due_date)}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ color: STATUS_LABELS[inv.status]?.color, background: `${STATUS_LABELS[inv.status]?.color}15`, borderRadius: '20px', padding: '2px 10px', fontSize: '0.72rem', fontWeight: 500 }}>
                        {STATUS_LABELS[inv.status]?.label}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {['sent', 'overdue'].includes(inv.status) && (
                        <button onClick={() => markPaid(inv.id)} disabled={marking === inv.id} style={{ padding: '0.3rem 0.75rem', background: 'rgba(62,207,142,0.1)', border: '1px solid rgba(62,207,142,0.2)', borderRadius: '6px', color: '#3ecf8e', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {marking === inv.id ? <Spinner size="sm" /> : '✓ Marquer payée'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={pageBtnStyle(false, page === 1)}>←</button>
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} style={pageBtnStyle(page === i + 1, false)}>{i + 1}</button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={pageBtnStyle(false, page === totalPages)}>→</button>
        </div>
      )}
    </SuperAdminLayout>
  )
}

function pageBtnStyle(active, disabled) {
  return {
    width: 32, height: 32, borderRadius: '8px',
    border: `1px solid ${active ? '#5b9cf6' : 'rgba(255,255,255,0.06)'}`,
    background: active ? 'rgba(91,156,246,0.1)' : 'transparent',
    color: active ? '#5b9cf6' : disabled ? '#333' : '#8b8d96',
    fontSize: '0.8rem', cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
}