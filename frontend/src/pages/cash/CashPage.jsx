import { useEffect, useState, useCallback } from 'react'
import DashboardLayout  from '../../components/layout/DashboardLayout'
import { cashApi }      from '../../api/cashApi'
import { useAuth }      from '../../context/AuthContext'
import { useToast }     from '../../context/ToastContext'
import { formatCurrency } from '../../utils/formatCurrency'
import Modal   from '../../components/ui/Modal'
import Alert   from '../../components/ui/Alert'
import Spinner from '../../components/ui/Spinner'
import {
  Wallet, TrendingUp, TrendingDown, Plus, Check,
  X, Clock, RefreshCw, Lock, Unlock, FileText,
  ArrowUpRight, ArrowDownRight, AlertCircle, Receipt 
} from 'lucide-react'

const CATEGORY_LABELS = {
  rent:         { label: 'Loyer',          color: '#3ecf8e', icon: <Wallet size={14} /> },
  deposit:      { label: 'Caution',        color: '#5b9cf6', icon: <ArrowUpRight size={14} /> },
  fees:         { label: 'Frais',          color: '#d4a853', icon: <FileText size={14} /> },
  commission:   { label: 'Commission',     color: '#a78bfa', icon: <TrendingUp size={14} /> },
  maintenance:  { label: 'Entretien',      color: '#e5534b', icon: <TrendingDown size={14} /> },
  refund:       { label: 'Remboursement',  color: '#8b8d96', icon: <ArrowDownRight size={14} /> },
  advance:      { label: 'Avance',         color: '#f59e0b', icon: <ArrowUpRight size={14} /> },
  other:        { label: 'Autre',          color: '#8b8d96', icon: <FileText size={14} /> },
}

const METHOD_LABELS = {
  cash:          'Espèces',
  wave:          'Wave',
  orange_money:  'Orange Money',
  bank_transfer: 'Virement',
  check:         'Chèque',
}

const EMPTY_OPERATION = {
  type: 'income', category: 'rent', amount: '',
  description: '', reference: '', property_id: '',
  tenant_id: '', payment_method: 'cash',
}

export default function CashPage() {
  const { user }  = useAuth()
  const { show }  = useToast()

  const isPrincipal = ['admin', 'caissier_principal'].includes(user?.role)

  const [session,    setSession]    = useState(null)
  const [operations, setOperations] = useState([])
  const [summary,    setSummary]    = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [activeTab,  setActiveTab]  = useState('dashboard')

  // Modals
  const [openModal,  setOpenModal]  = useState(false)
  const [closeModal, setCloseModal] = useState(false)
  const [opModal,    setOpModal]    = useState(false)
  const [opForm,     setOpForm]     = useState(EMPTY_OPERATION)
  const [openForm,   setOpenForm]   = useState({ opening_balance: '', notes: '' })
  const [closeForm,  setCloseForm]  = useState({ closing_balance: '', notes: '' })
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')

  // Rapport
  const [reportDate,   setReportDate]   = useState(new Date().toISOString().split('T')[0])
  const [reportData,   setReportData]   = useState(null)
  const [reportLoading, setReportLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [sessionRes, summaryRes] = await Promise.all([
        cashApi.getTodaySession(),
        cashApi.getSummary(),
      ])
      const s = sessionRes.data.data
      setSession(s)
      setSummary(summaryRes.data.data)

      if (s?.id) {
        const opsRes = await cashApi.getOperations(s.id)
        setOperations(opsRes.data.data || [])
      }
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // Ouvrir caisse
  const handleOpen = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await cashApi.openSession(openForm)
      show('Caisse ouverte', 'success')
      setOpenModal(false)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur')
    } finally { setSaving(false) }
  }

  // Clôturer caisse
  const handleClose = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await cashApi.closeSession(session.id, closeForm)
      show('Caisse clôturée', 'success')
      setCloseModal(false)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur')
    } finally { setSaving(false) }
  }

  // Ajouter opération
  const handleAddOp = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await cashApi.addOperation(opForm)
      show(isPrincipal ? 'Opération enregistrée' : 'Opération en attente de validation', 'success')
      setOpModal(false)
      setOpForm(EMPTY_OPERATION)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur')
    } finally { setSaving(false) }
  }

  // Valider / Rejeter opération
  const handleValidate = async (id) => {
    try {
      await cashApi.validateOperation(id)
      show('Opération validée', 'success')
      load()
    } catch { show('Erreur', 'error') }
  }

  const handleReject = async (id) => {
    if (!window.confirm('Rejeter cette opération ?')) return
    try {
      await cashApi.rejectOperation(id)
      show('Opération rejetée', 'success')
      load()
    } catch { show('Erreur', 'error') }
  }

  // Rapport journalier
  const loadReport = async () => {
    setReportLoading(true)
    try {
      const res = await cashApi.getDailyReport(reportDate)
      setReportData(res.data.data)
    } finally { setReportLoading(false) }
  }

  const sessionBalance = session
    ? session.opening_balance
      + parseFloat(session.total_income  || 0)
      - parseFloat(session.total_expense || 0)
    : 0

  const pendingOps = operations.filter(o => o.status === 'pending')
  const validatedOps = operations.filter(o => o.status === 'validated')

  if (loading) return (
    <DashboardLayout title="Caisse" subtitle="Gestion de la caisse journalière">
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <Spinner size="lg" />
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout title="Caisse" subtitle="Gestion de la caisse journalière">

      {/* Status caisse + actions */}
      <div style={{
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'space-between',
        padding:      '1rem 1.5rem',
        background:   session?.status === 'open'
          ? 'rgba(62,207,142,0.08)' : 'var(--lk-dark-2)',
        border:       `1px solid ${session?.status === 'open'
          ? 'rgba(62,207,142,0.2)' : 'var(--lk-border)'}`,
        borderRadius: 'var(--radius-lg)',
        marginBottom: '1.5rem',
        flexWrap:     'wrap',
        gap:          '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {session?.status === 'open'
            ? <Unlock size={20} color="#3ecf8e" />
            : <Lock   size={20} color="#8b8d96" />
          }
          <div>
            <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>
              {session?.status === 'open'
                ? 'Caisse ouverte'
                : 'Caisse fermée'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--lk-text-muted)' }}>
              {session?.status === 'open'
                ? `Ouverte avec ${formatCurrency(session.opening_balance)}`
                : 'Ouvrez votre caisse pour commencer'}
            </div>
          </div>
        </div>

        {session?.status === 'open' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--lk-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Solde actuel
            </div>
            <div style={{
              fontSize: '1.5rem', fontFamily: 'var(--font-display)',
              fontWeight: 600, color: 'var(--lk-amber)',
            }}>
              {formatCurrency(sessionBalance)}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          {!session && (
            <button className="lk-btn lk-btn-primary"
              onClick={() => setOpenModal(true)}
              style={{ gap: '6px', display: 'flex', alignItems: 'center' }}>
              <Unlock size={15} /> Ouvrir la caisse
            </button>
          )}
          {session?.status === 'open' && (
            <>
              <button className="lk-btn lk-btn-primary"
                onClick={() => { setOpForm(EMPTY_OPERATION); setError(''); setOpModal(true) }}
                style={{ gap: '6px', display: 'flex', alignItems: 'center' }}>
                <Plus size={15} /> Nouvelle opération
              </button>
              {isPrincipal && (
                <button className="lk-btn lk-btn-secondary"
                  onClick={() => { setCloseForm({ closing_balance: sessionBalance, notes: '' }); setError(''); setCloseModal(true) }}
                  style={{ gap: '6px', display: 'flex', alignItems: 'center', color: '#e5534b' }}>
                  <Lock size={15} /> Clôturer
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '4px',
        background: 'var(--lk-dark-2)', borderRadius: '10px',
        padding: '4px', marginBottom: '1.5rem',
        border: '1px solid var(--lk-border)',
      }}>
        {[
          { id: 'dashboard', label: 'Tableau de bord' },
          { id: 'operations', label: `Opérations${pendingOps.length > 0 ? ` (${pendingOps.length} en attente)` : ''}` },
          ...(isPrincipal ? [{ id: 'sessions', label: 'Sessions' }, { id: 'report', label: 'Rapport' }] : []),
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            flex: 1, padding: '0.5rem',
            background:   activeTab === tab.id ? 'var(--lk-amber-bg)' : 'transparent',
            border:       `1px solid ${activeTab === tab.id ? 'rgba(212,168,83,0.2)' : 'transparent'}`,
            borderRadius: '8px',
            color:        activeTab === tab.id ? 'var(--lk-amber)' : 'var(--lk-text-muted)',
            fontSize:     '0.8rem', fontWeight: activeTab === tab.id ? 500 : 400,
            cursor:       'pointer', transition: 'all 0.2s',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Dashboard ── */}
      {activeTab === 'dashboard' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: "Entrées aujourd'hui",  value: formatCurrency(summary?.today?.income_today),  color: '#3ecf8e', icon: <TrendingUp   size={18} /> },
              { label: "Sorties aujourd'hui",  value: formatCurrency(summary?.today?.expense_today), color: '#e5534b', icon: <TrendingDown size={18} /> },
              { label: 'Net du jour',           value: formatCurrency((summary?.today?.income_today || 0) - (summary?.today?.expense_today || 0)), color: 'var(--lk-amber)', icon: <Wallet size={18} /> },
              { label: 'Entrées du mois',       value: formatCurrency(summary?.month?.income_month),  color: '#5b9cf6', icon: <TrendingUp   size={18} /> },
              { label: 'Sorties du mois',       value: formatCurrency(summary?.month?.expense_month), color: '#e5534b', icon: <TrendingDown size={18} /> },
              ...(isPrincipal && summary?.pending > 0 ? [{
                label: 'En attente validation',
                value: summary.pending,
                color: '#d4a853',
                icon: <AlertCircle size={18} />,
              }] : []),
            ].map((card, i) => (
              <div key={i} style={{
                background:   'var(--lk-dark-2)',
                border:       '1px solid var(--lk-border)',
                borderRadius: 'var(--radius-lg)', padding: '1.25rem',
                position:     'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0,
                  height: '2px', background: `linear-gradient(90deg, ${card.color}, transparent)`,
                }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--lk-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {card.label}
                  </span>
                  <span style={{ color: card.color }}>{card.icon}</span>
                </div>
                <div style={{ fontSize: '1.3rem', fontFamily: 'var(--font-display)', fontWeight: 600, color: card.color }}>
                  {card.value ?? '—'}
                </div>
              </div>
            ))}
          </div>

          {/* Dernières opérations */}
          {validatedOps.length > 0 && (
            <div style={{
              background: 'var(--lk-dark-2)', border: '1px solid var(--lk-border)',
              borderRadius: 'var(--radius-lg)', overflow: 'hidden',
            }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--lk-border)', fontWeight: 500, fontSize: '0.875rem' }}>
                Opérations du jour
              </div>
              {validatedOps.slice(0, 5).map((op, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.875rem 1.25rem',
                  borderBottom: i < Math.min(validatedOps.length, 5) - 1
                    ? '1px solid var(--lk-border)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: op.type === 'income' ? 'rgba(62,207,142,0.1)' : 'rgba(229,83,75,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {op.type === 'income'
                        ? <ArrowUpRight   size={16} color="#3ecf8e" />
                        : <ArrowDownRight size={16} color="#e5534b" />
                      }
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{op.description}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--lk-text-muted)' }}>
                        {CATEGORY_LABELS[op.category]?.label} • {METHOD_LABELS[op.payment_method]}
                        {op.cashier_name && ` • ${op.cashier_name}`}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontWeight: 600, fontSize: '0.9rem',
                    color: op.type === 'income' ? '#3ecf8e' : '#e5534b',
                  }}>
                    {op.type === 'income' ? '+' : '-'}{formatCurrency(op.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Opérations ── */}
      {activeTab === 'operations' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>

          {/* En attente — principal seulement */}
          {isPrincipal && pendingOps.length > 0 && (
            <div style={{
              background:   'rgba(212,168,83,0.08)',
              border:       '1px solid rgba(212,168,83,0.2)',
              borderRadius: 'var(--radius-lg)',
              overflow:     'hidden',
              marginBottom: '1rem',
            }}>
              <div style={{
                padding: '0.75rem 1.25rem',
                borderBottom: '1px solid rgba(212,168,83,0.15)',
                display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '0.875rem', fontWeight: 500, color: '#d4a853',
              }}>
                <AlertCircle size={16} /> {pendingOps.length} opération(s) en attente de validation
              </div>
              {pendingOps.map((op, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.875rem 1.25rem',
                  borderBottom: i < pendingOps.length - 1 ? '1px solid rgba(212,168,83,0.1)' : 'none',
                }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{op.description}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--lk-text-muted)' }}>
                      {op.cashier_name} • {CATEGORY_LABELS[op.category]?.label}
                      • {op.type === 'income' ? 'Entrée' : 'Sortie'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, color: op.type === 'income' ? '#3ecf8e' : '#e5534b' }}>
                      {op.type === 'income' ? '+' : '-'}{formatCurrency(op.amount)}
                    </span>
                    <button
                      onClick={() => handleValidate(op.id)}
                      style={{
                        padding: '0.3rem 0.6rem', background: 'rgba(62,207,142,0.1)',
                        border: '1px solid rgba(62,207,142,0.2)', borderRadius: '6px',
                        color: '#3ecf8e', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                        fontSize: '0.75rem',
                      }}
                    >
                      <Check size={12} /> Valider
                    </button>
                    <button
                      onClick={() => handleReject(op.id)}
                      style={{
                        padding: '0.3rem 0.6rem', background: 'rgba(229,83,75,0.1)',
                        border: '1px solid rgba(229,83,75,0.2)', borderRadius: '6px',
                        color: '#e5534b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                        fontSize: '0.75rem',
                      }}
                    >
                      <X size={12} /> Rejeter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Toutes les opérations */}
          <div style={{
            background: 'var(--lk-dark-2)', border: '1px solid var(--lk-border)',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: 'var(--lk-dark-3)', borderBottom: '1px solid var(--lk-border)' }}>
                  {['Type', 'Description', 'Catégorie', 'Montant', 'Méthode', 'Statut', 'Heure'].map(h => (
                    <th key={h} style={{
                      padding: '0.75rem 1rem', textAlign: 'left',
                      fontSize: '0.68rem', color: 'var(--lk-text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {operations.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--lk-text-muted)' }}>
                      <Wallet size={32} style={{ opacity: 0.2, marginBottom: '0.5rem', display: 'block', margin: '0 auto 0.5rem' }} />
                      Aucune opération aujourd'hui
                    </td>
                  </tr>
                ) : operations.map((op, i) => (
                  <tr key={i}
                    style={{ borderBottom: '1px solid var(--lk-border)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--lk-dark-3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        fontSize: '0.75rem', fontWeight: 500,
                        color:      op.type === 'income' ? '#3ecf8e' : '#e5534b',
                        background: op.type === 'income' ? 'rgba(62,207,142,0.1)' : 'rgba(229,83,75,0.1)',
                        borderRadius: '20px', padding: '2px 8px',
                      }}>
                        {op.type === 'income'
                          ? <ArrowUpRight   size={12} />
                          : <ArrowDownRight size={12} />
                        }
                        {op.type === 'income' ? 'Entrée' : 'Sortie'}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ fontWeight: 500 }}>{op.description}</div>
                      {op.tenant_name && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--lk-text-muted)' }}>
                          {op.tenant_name}
                        </div>
                      )}
                      {isPrincipal && op.cashier_name && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--lk-text-muted)' }}>
                          {op.cashier_name}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 500,
                        color:      CATEGORY_LABELS[op.category]?.color,
                        background: `${CATEGORY_LABELS[op.category]?.color}15`,
                        borderRadius: '20px', padding: '2px 8px',
                      }}>
                        {CATEGORY_LABELS[op.category]?.label}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600,
                      color: op.type === 'income' ? '#3ecf8e' : '#e5534b',
                    }}>
                      {op.type === 'income' ? '+' : '-'}{formatCurrency(op.amount)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--lk-text-muted)', fontSize: '0.75rem' }}>
                      {METHOD_LABELS[op.payment_method]}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 500,
                        color:      op.status === 'validated' ? '#3ecf8e'
                               : op.status === 'pending'   ? '#d4a853' : '#e5534b',
                        background: op.status === 'validated' ? 'rgba(62,207,142,0.1)'
                               : op.status === 'pending'   ? 'rgba(212,168,83,0.1)'  : 'rgba(229,83,75,0.1)',
                        borderRadius: '20px', padding: '2px 8px',
                      }}>
                        {op.status === 'validated' ? 'Validée' : op.status === 'pending' ? 'En attente' : 'Rejetée'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--lk-text-muted)', fontSize: '0.72rem' }}>
                      {op.created_at ? new Date(op.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Sessions ── */}
      {activeTab === 'sessions' && isPrincipal && (
        <SessionsTab />
      )}

      {/* ── Rapport ── */}
      {activeTab === 'report' && isPrincipal && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', alignItems: 'center' }}>
            <input className="lk-input" type="date"
              value={reportDate}
              onChange={e => setReportDate(e.target.value)}
              style={{ width: 'auto' }} />
            <button className="lk-btn lk-btn-primary"
              onClick={loadReport} disabled={reportLoading}
              style={{ gap: '6px', display: 'flex', alignItems: 'center' }}>
              {reportLoading ? <Spinner size="sm" /> : <RefreshCw size={14} />}
              Générer
            </button>
          </div>

          {reportData && (
            <div>
              {/* Résumé */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'Entrées',  value: formatCurrency(reportData.total_income),  color: '#3ecf8e' },
                  { label: 'Sorties',  value: formatCurrency(reportData.total_expense), color: '#e5534b' },
                  { label: 'Net',      value: formatCurrency(reportData.net),            color: 'var(--lk-amber)' },
                ].map((c, i) => (
                  <div key={i} style={{
                    background: 'var(--lk-dark-2)', border: '1px solid var(--lk-border)',
                    borderRadius: 'var(--radius-lg)', padding: '1rem', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--lk-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      {c.label}
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 600, color: c.color }}>
                      {c.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Détail */}
              <div style={{
                background: 'var(--lk-dark-2)', border: '1px solid var(--lk-border)',
                borderRadius: 'var(--radius-lg)', overflow: 'hidden',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--lk-dark-3)', borderBottom: '1px solid var(--lk-border)' }}>
                      {['Heure', 'Type', 'Description', 'Caissier', 'Montant'].map(h => (
                        <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.68rem', color: 'var(--lk-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.operations.map((op, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--lk-border)' }}>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--lk-text-muted)', fontSize: '0.72rem' }}>
                          {new Date(op.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ color: op.type === 'income' ? '#3ecf8e' : '#e5534b', fontSize: '0.75rem', fontWeight: 500 }}>
                            {op.type === 'income' ? '↑ Entrée' : '↓ Sortie'}
                          </span>
                        </td>
                       <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 500 }}>{op.description}</div>
                          {op.payment_id && (
                            <div style={{
                              fontSize: '0.68rem', color: 'var(--lk-amber)',
                              display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px',
                            }}>
                              <Receipt size={10} /> Lié au paiement #{op.payment_id}
                            </div>
                          )}
                       </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--lk-text-muted)' }}>{op.cashier_name}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: op.type === 'income' ? '#3ecf8e' : '#e5534b' }}>
                          {op.type === 'income' ? '+' : '-'}{formatCurrency(op.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modal Ouvrir caisse ── */}
      <Modal isOpen={openModal} onClose={() => setOpenModal(false)}
        title="Ouvrir la caisse"
        footer={
          <>
            <button className="lk-btn lk-btn-secondary" onClick={() => setOpenModal(false)}>Annuler</button>
            <button className="lk-btn lk-btn-primary" onClick={handleOpen} disabled={saving}>
              {saving ? <Spinner size="sm" /> : <><Unlock size={14} /> Ouvrir</>}
            </button>
          </>
        }
      >
        <Alert type="error" message={error} onClose={() => setError('')} />
        <div className="lk-input-group">
          <label className="lk-label">Solde d'ouverture (FCFA)</label>
          <input className="lk-input" type="number" placeholder="0"
            value={openForm.opening_balance}
            onChange={e => setOpenForm({ ...openForm, opening_balance: e.target.value })} />
          <div style={{ fontSize: '0.75rem', color: 'var(--lk-text-muted)', marginTop: '4px' }}>
            Montant en caisse au moment de l'ouverture
          </div>
        </div>
        <div className="lk-input-group">
          <label className="lk-label">Notes (optionnel)</label>
          <textarea className="lk-input" rows={2}
            value={openForm.notes}
            onChange={e => setOpenForm({ ...openForm, notes: e.target.value })}
            style={{ resize: 'vertical' }} />
        </div>
      </Modal>

      {/* ── Modal Clôturer caisse ── */}
      <Modal isOpen={closeModal} onClose={() => setCloseModal(false)}
        title="Clôturer la caisse"
        footer={
          <>
            <button className="lk-btn lk-btn-secondary" onClick={() => setCloseModal(false)}>Annuler</button>
            <button className="lk-btn lk-btn-danger" onClick={handleClose} disabled={saving}>
              {saving ? <Spinner size="sm" /> : <><Lock size={14} /> Clôturer</>}
            </button>
          </>
        }
      >
        <Alert type="error" message={error} onClose={() => setError('')} />
        <div style={{
          padding: '0.75rem 1rem', background: 'var(--lk-amber-bg)',
          borderRadius: 'var(--radius-md)', marginBottom: '1rem',
          fontSize: '0.875rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: 'var(--lk-text-muted)' }}>Solde d'ouverture</span>
            <span>{formatCurrency(session?.opening_balance)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: '#3ecf8e' }}>+ Entrées</span>
            <span style={{ color: '#3ecf8e' }}>{formatCurrency(session?.total_income)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: '#e5534b' }}>- Sorties</span>
            <span style={{ color: '#e5534b' }}>{formatCurrency(session?.total_expense)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, borderTop: '1px solid var(--lk-border)', paddingTop: '4px', marginTop: '4px' }}>
            <span style={{ color: 'var(--lk-amber)' }}>Solde calculé</span>
            <span style={{ color: 'var(--lk-amber)' }}>{formatCurrency(sessionBalance)}</span>
          </div>
        </div>

        <div className="lk-input-group">
          <label className="lk-label">Solde de clôture réel (FCFA)</label>
          <input className="lk-input" type="number"
            value={closeForm.closing_balance}
            onChange={e => setCloseForm({ ...closeForm, closing_balance: e.target.value })} />
          <div style={{ fontSize: '0.75rem', color: 'var(--lk-text-muted)', marginTop: '4px' }}>
            Montant physique compté en caisse
          </div>
        </div>
        <div className="lk-input-group">
          <label className="lk-label">Notes de clôture</label>
          <textarea className="lk-input" rows={2}
            value={closeForm.notes}
            onChange={e => setCloseForm({ ...closeForm, notes: e.target.value })}
            style={{ resize: 'vertical' }} />
        </div>
      </Modal>

      {/* ── Modal Nouvelle opération ── */}
      <Modal isOpen={opModal} onClose={() => setOpModal(false)}
        title="Nouvelle opération"
        footer={
          <>
            <button className="lk-btn lk-btn-secondary" onClick={() => setOpModal(false)}>Annuler</button>
            <button className="lk-btn lk-btn-primary" onClick={handleAddOp} disabled={saving}>
              {saving ? <Spinner size="sm" /> : <><Plus size={14} /> Enregistrer</>}
            </button>
          </>
        }
      >
        <Alert type="error" message={error} onClose={() => setError('')} />

        {!isPrincipal && (
          <div style={{
            padding: '0.6rem 0.875rem', background: 'rgba(212,168,83,0.08)',
            border: '1px solid rgba(212,168,83,0.2)', borderRadius: 'var(--radius-md)',
            fontSize: '0.8rem', color: '#d4a853', marginBottom: '1rem',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <Clock size={14} /> Votre opération sera soumise à validation
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Type</label>
            <select className="lk-input" value={opForm.type}
              onChange={e => setOpForm({ ...opForm, type: e.target.value })}>
              <option value="income">Entrée (+)</option>
              <option value="expense">Sortie (-)</option>
            </select>
          </div>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Catégorie</label>
            <select className="lk-input" value={opForm.category}
              onChange={e => setOpForm({ ...opForm, category: e.target.value })}>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="lk-input-group" style={{ marginTop: '1rem' }}>
          <label className="lk-label">Description</label>
          <input className="lk-input" type="text" placeholder="Ex: Loyer janvier — Fatou Diop"
            value={opForm.description}
            onChange={e => setOpForm({ ...opForm, description: e.target.value })} required />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Montant (FCFA)</label>
            <input className="lk-input" type="number" placeholder="50000"
              value={opForm.amount}
              onChange={e => setOpForm({ ...opForm, amount: e.target.value })} required />
          </div>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Mode de paiement</label>
            <select className="lk-input" value={opForm.payment_method}
              onChange={e => setOpForm({ ...opForm, payment_method: e.target.value })}>
              {Object.entries(METHOD_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="lk-input-group" style={{ marginTop: '1rem' }}>
          <label className="lk-label">Référence (optionnel)</label>
          <input className="lk-input" type="text" placeholder="N° reçu, N° chèque..."
            value={opForm.reference}
            onChange={e => setOpForm({ ...opForm, reference: e.target.value })} />
        </div>
      </Modal>
    </DashboardLayout>
  )
}

// Composant Sessions séparé
function SessionsTab() {
  const [sessions, setSessions] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    cashApi.getSessions()
      .then(res => setSessions(res.data.data || []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Spinner size="md" /></div>

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{
        background: 'var(--lk-dark-2)', border: '1px solid var(--lk-border)',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ background: 'var(--lk-dark-3)', borderBottom: '1px solid var(--lk-border)' }}>
              {['Date', 'Caissier', 'Ouverture', 'Entrées', 'Sorties', 'Clôture', 'Statut'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.68rem', color: 'var(--lk-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessions.map((s, i) => (
              <tr key={i}
                style={{ borderBottom: '1px solid var(--lk-border)', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--lk-dark-3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '0.85rem 1rem', fontWeight: 500 }}>
                  {new Date(s.date).toLocaleDateString('fr-FR')}
                </td>
                <td style={{ padding: '0.85rem 1rem', color: 'var(--lk-text-secondary)' }}>
                  {s.cashier_name}
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  {formatCurrency(s.opening_balance)}
                </td>
                <td style={{ padding: '0.85rem 1rem', color: '#3ecf8e' }}>
                  +{formatCurrency(s.total_income)}
                </td>
                <td style={{ padding: '0.85rem 1rem', color: '#e5534b' }}>
                  -{formatCurrency(s.total_expense)}
                </td>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 500, color: 'var(--lk-amber)' }}>
                  {s.closing_balance !== null ? formatCurrency(s.closing_balance) : '—'}
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 500,
                    color:      s.status === 'open' ? '#3ecf8e' : '#8b8d96',
                    background: s.status === 'open' ? 'rgba(62,207,142,0.1)' : 'rgba(139,141,150,0.1)',
                    borderRadius: '20px', padding: '2px 8px',
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                  }}>
                    {s.status === 'open' ? <><Unlock size={10} /> Ouverte</> : <><Lock size={10} /> Clôturée</>}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}