import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import DataTable       from '../../components/ui/DataTable'
import Modal           from '../../components/ui/Modal'
import Alert           from '../../components/ui/Alert'
import Spinner         from '../../components/ui/Spinner'
import SearchBar       from '../../components/ui/SearchBar'
import Pagination      from '../../components/ui/Pagination'
import ExportButton    from '../../components/ui/ExportButton'
import { useToast }    from '../../context/ToastContext'
import { useAuth }     from '../../context/AuthContext'
import { paymentApi }  from '../../api/paymentApi'
import { contractApi } from '../../api/contractApi'
import PaymentReceiptModal     from './PaymentReceiptModal'
import { formatCurrency }      from '../../utils/formatCurrency'
import { formatDate }          from '../../utils/formatDate'
import { exportToExcel }       from '../../utils/excelExport'
import { exportListToPdf }     from '../../utils/pdfExport'
import { usePaginationFilter } from '../../hooks/usePaginationFilter'
import OnlinePaymentButton     from '../../components/ui/OnlinePaymentButton'
import { Wallet }              from 'lucide-react'

const EMPTY_FORM = {
  contract_id: '', amount_due: '', amount_paid: '',
  due_date: '', payment_date: '', period_month: '',
  period_year: new Date().getFullYear(),
  status: 'pending', payment_method: 'cash', notes: '',
}

const STATUS_LABELS = {
  pending: { label: 'En attente', css: 'lk-badge-warning' },
  paid:    { label: 'Payé',       css: 'lk-badge-success' },
  partial: { label: 'Partiel',    css: 'lk-badge-info' },
  late:    { label: 'En retard',  css: 'lk-badge-danger' },
}

const METHOD_LABELS = {
  cash:         'Espèces',
  transfer:     'Virement',
  mobile_money: 'Mobile Money',
  check:        'Chèque',
}

const MONTHS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
]

export default function PaymentsPage() {
  const { show }   = useToast()
  const { agency } = useAuth()

  const [data,      setData]      = useState([])
  const [contracts, setContracts] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(false)
  const [editing,   setEditing]   = useState(null)
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [error,     setError]     = useState('')
  const [saving,    setSaving]    = useState(false)
  const [receiptModal,     setReceiptModal]     = useState(false)
  const [selectedPayment,  setSelectedPayment]  = useState(null)
  const [selectedContract, setSelectedContract] = useState(null)
  const [statusFilter,     setStatusFilter]     = useState('all')

  const customFilter = useCallback((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false
    return true
  }, [statusFilter])

  const {
    paginated, filtered, totalPages, currentPage,
    search, setCurrentPage, handleSearch,
  } = usePaginationFilter(data, 10, customFilter)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [paymentsRes, contractsRes] = await Promise.all([
        paymentApi.getAll(),
        contractApi.getAll(),
      ])
      const raw = paymentsRes.data?.data
      setData(Array.isArray(raw) ? raw : raw?.data || [])
      const rawContracts = contractsRes.data?.data
      setContracts(Array.isArray(rawContracts) ? rawContracts : [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null); setForm(EMPTY_FORM); setError(''); setModal(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({
      contract_id:    row.contract_id    || '',
      amount_due:     row.amount_due     || '',
      amount_paid:    row.amount_paid    || '',
      due_date:       row.due_date       || '',
      payment_date:   row.payment_date   || '',
      period_month:   row.period_month   || '',
      period_year:    row.period_year    || new Date().getFullYear(),
      status:         row.status         || 'pending',
      payment_method: row.payment_method || 'cash',
      notes:          row.notes          || '',
    })
    setError(''); setModal(true)
  }

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      if (editing) {
        await paymentApi.update(editing.id, form)
        show('Paiement mis à jour', 'success')
      } else {
        await paymentApi.create(form)
        show('Paiement enregistré', 'success')
      }
      setModal(false)
      load()
    } catch (err) {
      const errors = err.response?.data?.errors
      setError(errors
        ? Object.values(errors).flat()[0]
        : err.response?.data?.message || 'Erreur')
    } finally { setSaving(false) }
  }

  const exportExcel = () => exportToExcel(
    filtered,
    [
      { key: 'tenant_name',    label: 'Locataire' },
      { key: 'property_title', label: 'Bien' },
      { key: 'period_month',   label: 'Mois',
        format: v => MONTHS[(v || 1) - 1] },
      { key: 'period_year',    label: 'Année' },
      { key: 'amount_due',     label: 'Montant dû (FCFA)' },
      { key: 'amount_paid',    label: 'Montant payé (FCFA)' },
      { key: 'due_date',       label: 'Date échéance',
        format: v => v ? new Date(v).toLocaleDateString('fr-FR') : '—' },
      { key: 'payment_date',   label: 'Date paiement',
        format: v => v ? new Date(v).toLocaleDateString('fr-FR') : '—' },
      { key: 'status',         label: 'Statut',
        format: v => STATUS_LABELS[v]?.label || v },
      { key: 'payment_method', label: 'Mode paiement',
        format: v => METHOD_LABELS[v] || v },
    ],
    `paiements_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}`,
    'Paiements'
  )

  const exportPdf = () => exportListToPdf(
    filtered,
    [
      { key: 'tenant_name',    label: 'Locataire' },
      { key: 'property_title', label: 'Bien' },
      { key: 'period_month',   label: 'Mois',
        format: v => MONTHS[(v || 1) - 1] },
      { key: 'period_year',    label: 'Année' },
      { key: 'amount_due',     label: 'Dû (FCFA)',
        format: v => new Intl.NumberFormat('fr-FR').format(v) + ' FCFA' },
      { key: 'amount_paid',    label: 'Payé (FCFA)',
        format: v => new Intl.NumberFormat('fr-FR').format(v) + ' FCFA' },
      { key: 'status',         label: 'Statut',
        format: v => STATUS_LABELS[v]?.label || v },
      { key: 'payment_method', label: 'Mode',
        format: v => METHOD_LABELS[v] || v },
    ],
    'Liste des paiements',
    agency
  )

  const columns = [
    {
      key: 'tenant_name', label: 'Locataire / Bien',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 500 }}>{val || '—'}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--lk-text-muted)' }}>
            {row.property_title || ''}
          </div>
        </div>
      ),
    },
    {
      key: 'period_month', label: 'Période',
      render: (v, row) => (
        <span style={{ color: 'var(--lk-text-secondary)' }}>
          {MONTHS[(v || 1) - 1]} {row.period_year}
        </span>
      ),
    },
    {
      key: 'amount_due', label: 'Montant dû',
      render: v => <span>{formatCurrency(v)}</span>,
    },
    {
      key: 'amount_paid', label: 'Payé',
      render: v => (
        <span style={{ color: 'var(--lk-success)', fontWeight: 500 }}>
          {formatCurrency(v)}
        </span>
      ),
    },
    { key: 'due_date', label: 'Échéance', render: v => formatDate(v) },
    {
      key: 'status', label: 'Statut',
      render: v => (
        <span className={`lk-badge ${STATUS_LABELS[v]?.css}`}>
          {STATUS_LABELS[v]?.label}
        </span>
      ),
    },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {['pending', 'late', 'partial'].includes(row.status) && (
            <OnlinePaymentButton
              paymentId={row.id}
              amount={row.amount_due}
            />
          )}
          {['paid', 'partial'].includes(row.status) && (
            <button
              className="lk-btn lk-btn-secondary"
              style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', color: 'var(--lk-amber)' }}
              onClick={() => {
                const contract = contracts.find(c => c.id === row.contract_id)
                setSelectedPayment(row)
                setSelectedContract(contract || {
                  tenant_name:    row.tenant_name,
                  property_title: row.property_title,
                })
                setReceiptModal(true)
              }}
            >
              Quittance
            </button>
          )}
          <button
            className="lk-btn lk-btn-secondary"
            style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
            onClick={() => openEdit(row)}
          >
            Modifier
          </button>
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout title="Paiements" subtitle="Suivez les paiements de loyers">

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '1rem',
        flexWrap: 'wrap', gap: '8px',
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
          <SearchBar
            value={search}
            onChange={handleSearch}
            placeholder="Rechercher un paiement..."
          />
          <select
            className="lk-input"
            style={{ width: 'auto', fontSize: '0.875rem' }}
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1) }}
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="paid">Payé</option>
            <option value="partial">Partiel</option>
            <option value="late">En retard</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <ExportButton onExportExcel={exportExcel} onExportPdf={exportPdf} />
          <button className="lk-btn lk-btn-primary" onClick={openCreate}>
            + Nouveau paiement
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={paginated}
        loading={loading}
        emptyMessage="Aucun paiement enregistré"
        emptyIcon={<Wallet size={48} />}
        totalCount={filtered.length}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modal Créer / Modifier */}
      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Modifier le paiement' : 'Nouveau paiement'}
        footer={
          <>
            <button className="lk-btn lk-btn-secondary" onClick={() => setModal(false)}>
              Annuler
            </button>
            <button className="lk-btn lk-btn-primary" onClick={save} disabled={saving}>
              {saving ? <Spinner size="sm" /> : (editing ? 'Mettre à jour' : 'Enregistrer')}
            </button>
          </>
        }
      >
        <Alert type="error" message={error} onClose={() => setError('')} />

        <div className="lk-input-group">
          <label className="lk-label">Contrat</label>
          <select
            className="lk-input"
            value={form.contract_id}
            onChange={e => setForm({ ...form, contract_id: e.target.value })}
            required
          >
            <option value="">Sélectionner un contrat</option>
            {contracts.map(c => (
              <option key={c.id} value={c.id}>
                {c.tenant_name} — {c.property_title}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Mois</label>
            <select
              className="lk-input"
              value={form.period_month}
              onChange={e => setForm({ ...form, period_month: e.target.value })}
              required
            >
              <option value="">Mois</option>
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Année</label>
            <input
              className="lk-input" type="number" placeholder="2026"
              value={form.period_year}
              onChange={e => setForm({ ...form, period_year: e.target.value })}
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Montant dû (FCFA)</label>
            <input
              className="lk-input" type="number" placeholder="150000"
              value={form.amount_due}
              onChange={e => setForm({ ...form, amount_due: e.target.value })}
              required
            />
          </div>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Montant payé (FCFA)</label>
            <input
              className="lk-input" type="number" placeholder="150000"
              value={form.amount_paid}
              onChange={e => setForm({ ...form, amount_paid: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Date d'échéance</label>
            <input
              className="lk-input" type="date"
              value={form.due_date}
              onChange={e => setForm({ ...form, due_date: e.target.value })}
              required
            />
          </div>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Date de paiement</label>
            <input
              className="lk-input" type="date"
              value={form.payment_date}
              onChange={e => setForm({ ...form, payment_date: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Statut</label>
            <select
              className="lk-input"
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
            >
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Mode de paiement</label>
            <select
              className="lk-input"
              value={form.payment_method}
              onChange={e => setForm({ ...form, payment_method: e.target.value })}
            >
              {Object.entries(METHOD_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* Modal Quittance */}
      <PaymentReceiptModal
        isOpen={receiptModal}
        onClose={() => setReceiptModal(false)}
        payment={selectedPayment}
        contract={selectedContract}
        agency={agency}
      />

    </DashboardLayout>
  )
}