import { useEffect, useState, useCallback } from 'react'
import DashboardLayout  from '../../components/layout/DashboardLayout'
import DataTable        from '../../components/ui/DataTable'
import Modal            from '../../components/ui/Modal'
import Alert            from '../../components/ui/Alert'
import Spinner          from '../../components/ui/Spinner'
import SearchBar        from '../../components/ui/SearchBar'
import Pagination       from '../../components/ui/Pagination'
import ExportButton     from '../../components/ui/ExportButton'
import ContractPrintModal from './ContractPrintModal'
import { useToast }     from '../../context/ToastContext'
import { useAuth }      from '../../context/AuthContext'
import { contractApi }  from '../../api/contractApi'
import { propertyApi }  from '../../api/propertyApi'
import { tenantApi }    from '../../api/tenantApi'
import { formatCurrency }            from '../../utils/formatCurrency'
import { formatDate }                from '../../utils/formatDate'
import { exportToExcel }             from '../../utils/excelExport'
import { exportListToPdf }           from '../../utils/pdfExport'
import { usePaginationFilter }       from '../../hooks/usePaginationFilter'
import {
  Plus, Pencil, Trash2, Printer,
  FileText, Home, UserCheck,
} from 'lucide-react'

const EMPTY_FORM = {
  property_id: '', tenant_id: '', start_date: '',
  end_date: '', rent_amount: '', deposit_amount: '',
  payment_day: 5, status: 'active', notes: '',
}

const STATUS_LABELS = {
  active:     { label: 'Actif',    css: 'lk-badge-success' },
  expired:    { label: 'Expiré',   css: 'lk-badge-muted' },
  terminated: { label: 'Résilié',  css: 'lk-badge-danger' },
}

export default function ContractsPage() {
  const { show }         = useToast()
  const { user, agency } = useAuth()
  const isAdmin          = user?.role === 'admin'

  const [data,       setData]       = useState([])
  const [properties, setProperties] = useState([])
  const [tenants,    setTenants]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(false)
  const [editing,    setEditing]    = useState(null)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [error,      setError]      = useState('')
  const [saving,     setSaving]     = useState(false)
  const [printModal,       setPrintModal]       = useState(false)
  const [selectedContract, setSelectedContract] = useState(null)
  const [statusFilter,     setStatusFilter]     = useState('all')

  const customFilter = useCallback((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false
    return true
  }, [statusFilter])

  const {
    paginated, filtered, totalPages, currentPage,
    search, setCurrentPage, handleSearch,
  } = usePaginationFilter(data, 8, customFilter)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cRes, pRes, tRes] = await Promise.all([
        contractApi.getAll(),
        propertyApi.getAll(),
        tenantApi.getAll(),
      ])
      const rawC = cRes.data?.data
      const rawP = pRes.data?.data
      const rawT = tRes.data?.data
      setData(Array.isArray(rawC) ? rawC : rawC?.data || [])
      setProperties(Array.isArray(rawP) ? rawP : rawP?.data || [])
      setTenants(Array.isArray(rawT) ? rawT : rawT?.data || [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null); setForm(EMPTY_FORM); setError(''); setModal(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({
      property_id:    row.property_id    || '',
      tenant_id:      row.tenant_id      || '',
      start_date:     row.start_date     || '',
      end_date:       row.end_date       || '',
      rent_amount:    row.rent_amount    || '',
      deposit_amount: row.deposit_amount || '',
      payment_day:    row.payment_day    || 5,
      status:         row.status         || 'active',
      notes:          row.notes          || '',
    })
    setError(''); setModal(true)
  }

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      if (editing) {
        await contractApi.update(editing.id, form)
        show('Contrat mis à jour', 'success')
      } else {
        await contractApi.create(form)
        show('Contrat créé', 'success')
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

  const remove = async (id) => {
    if (!window.confirm('Supprimer ce contrat ?')) return
    try {
      await contractApi.delete(id)
      show('Contrat supprimé', 'success')
      load()
    } catch { show('Erreur lors de la suppression', 'error') }
  }

  const exportExcel = () => exportToExcel(
    filtered,
    [
      { key: 'property_title', label: 'Bien' },
      { key: 'tenant_name',    label: 'Locataire' },
      { key: 'rent_amount',    label: 'Loyer (FCFA)' },
      { key: 'deposit_amount', label: 'Caution (FCFA)' },
      { key: 'start_date',     label: 'Date début',
        format: v => v ? new Date(v).toLocaleDateString('fr-FR') : '—' },
      { key: 'end_date',       label: 'Date fin',
        format: v => v ? new Date(v).toLocaleDateString('fr-FR') : 'Indéterminée' },
      { key: 'payment_day',    label: 'Jour paiement' },
      { key: 'status',         label: 'Statut',
        format: v => STATUS_LABELS[v]?.label || v },
    ],
    `contrats_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}`,
    'Contrats'
  )

  const exportPdf = () => exportListToPdf(
    filtered,
    [
      { key: 'property_title', label: 'Bien' },
      { key: 'tenant_name',    label: 'Locataire' },
      { key: 'rent_amount',    label: 'Loyer (FCFA)',
        format: v => new Intl.NumberFormat('fr-FR').format(v) + ' FCFA' },
      { key: 'start_date',     label: 'Début',
        format: v => v ? new Date(v).toLocaleDateString('fr-FR') : '—' },
      { key: 'end_date',       label: 'Fin',
        format: v => v ? new Date(v).toLocaleDateString('fr-FR') : 'Indéterminée' },
      { key: 'status',         label: 'Statut',
        format: v => STATUS_LABELS[v]?.label || v },
    ],
    'Liste des contrats',
    agency
  )

  const columns = [
    {
      key: 'property_title', label: 'Bien',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 'var(--radius-md)',
            background: 'var(--lk-amber-bg)',
            border: '1px solid rgba(212,168,83,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Home size={15} color="var(--lk-amber)" />
          </div>
          <div>
            <div style={{ fontWeight: 500 }}>{val || '—'}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--lk-text-muted)' }}>
              {row.property_address || ''}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'tenant_name', label: 'Locataire',
      render: v => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--lk-text-secondary)' }}>
          <UserCheck size={13} /> {v || '—'}
        </div>
      ),
    },
    {
      key: 'rent_amount', label: 'Loyer',
      render: v => (
        <span style={{ color: 'var(--lk-amber)', fontWeight: 500 }}>
          {formatCurrency(v)}
        </span>
      ),
    },
    {
      key: 'start_date', label: 'Début',
      render: v => formatDate(v),
    },
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
          <button
            className="lk-btn lk-btn-secondary"
            style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--lk-amber)' }}
            onClick={() => { setSelectedContract(row); setPrintModal(true) }}
          >
            <Printer size={13} /> Imprimer
          </button>
          <button
            className="lk-btn lk-btn-secondary"
            style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}
            onClick={() => openEdit(row)}
          >
            <Pencil size={13} /> Modifier
          </button>
          {isAdmin && (
            <button
              className="lk-btn lk-btn-danger"
              style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}
              onClick={() => remove(row.id)}
            >
              <Trash2 size={13} /> Supprimer
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout title="Contrats" subtitle="Gérez vos contrats de location">

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '1rem',
        flexWrap: 'wrap', gap: '8px',
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
          <SearchBar value={search} onChange={handleSearch} placeholder="Rechercher un contrat..." />
          <select
            className="lk-input"
            style={{ width: 'auto', fontSize: '0.875rem' }}
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1) }}
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="expired">Expiré</option>
            <option value="terminated">Résilié</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <ExportButton onExportExcel={exportExcel} onExportPdf={exportPdf} />
          <button
            className="lk-btn lk-btn-primary"
            onClick={openCreate}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={15} /> Nouveau contrat
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={paginated}
        loading={loading}
        emptyMessage="Aucun contrat enregistré"
        emptyIcon={<FileText size={32} style={{ opacity: 0.2 }} />}
        totalCount={filtered.length}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Modifier le contrat' : 'Nouveau contrat'}
        footer={
          <>
            <button className="lk-btn lk-btn-secondary" onClick={() => setModal(false)}>
              Annuler
            </button>
            <button
              className="lk-btn lk-btn-primary"
              onClick={save}
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {saving ? <Spinner size="sm" /> : <><Plus size={14} /> {editing ? 'Mettre à jour' : 'Créer'}</>}
            </button>
          </>
        }
      >
        <Alert type="error" message={error} onClose={() => setError('')} />

        <div className="lk-input-group">
          <label className="lk-label">Bien immobilier</label>
          <select className="lk-input" value={form.property_id}
            onChange={e => setForm({ ...form, property_id: e.target.value })} required>
            <option value="">Sélectionner un bien</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.title} — {p.city}</option>
            ))}
          </select>
        </div>

        <div className="lk-input-group">
          <label className="lk-label">Locataire</label>
          <select className="lk-input" value={form.tenant_id}
            onChange={e => setForm({ ...form, tenant_id: e.target.value })} required>
            <option value="">Sélectionner un locataire</option>
            {tenants.map(t => (
              <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Date de début</label>
            <input className="lk-input" type="date" value={form.start_date}
              onChange={e => setForm({ ...form, start_date: e.target.value })} required />
          </div>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Date de fin</label>
            <input className="lk-input" type="date" value={form.end_date}
              onChange={e => setForm({ ...form, end_date: e.target.value })} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Loyer mensuel (FCFA)</label>
            <input className="lk-input" type="number" placeholder="150000"
              value={form.rent_amount}
              onChange={e => setForm({ ...form, rent_amount: e.target.value })} required />
          </div>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Jour de paiement</label>
            <input className="lk-input" type="number" min="1" max="28" placeholder="5"
              value={form.payment_day}
              onChange={e => setForm({ ...form, payment_day: e.target.value })} />
          </div>
        </div>

        {editing && (
          <div className="lk-input-group" style={{ marginTop: '1rem' }}>
            <label className="lk-label">Statut</label>
            <select className="lk-input" value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        )}
      </Modal>

      <ContractPrintModal
        isOpen={printModal}
        onClose={() => setPrintModal(false)}
        contract={selectedContract}
        agency={agency}
      />

    </DashboardLayout>
  )
}