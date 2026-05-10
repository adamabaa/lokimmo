import { useEffect, useState, useCallback } from 'react'
import DashboardLayout  from '../../components/layout/DashboardLayout'
import DataTable        from '../../components/ui/DataTable'
import Modal            from '../../components/ui/Modal'
import Alert            from '../../components/ui/Alert'
import Spinner          from '../../components/ui/Spinner'
import SearchBar        from '../../components/ui/SearchBar'
import Pagination       from '../../components/ui/Pagination'
import ExportButton     from '../../components/ui/ExportButton'
import PlanLimitModal   from '../../components/ui/PlanLimitModal'
import { useToast }     from '../../context/ToastContext'
import { useAuth }      from '../../context/AuthContext'
import { propertyApi }  from '../../api/propertyApi'
import { ownerApi }     from '../../api/ownerApi'
import { formatCurrency }              from '../../utils/formatCurrency'
import { exportToExcel }               from '../../utils/excelExport'
import { exportListToPdf }             from '../../utils/pdfExport'
import { usePaginationFilter }         from '../../hooks/usePaginationFilter'
import { isPlanLimit, getPlanLimitMessage } from '../../utils/planLimit'
import {
  Plus, Pencil, Trash2, Home,
  Building2, MapPin, DollarSign,
} from 'lucide-react'

const EMPTY_FORM = {
  owner_id: '', title: '', type: 'apartment',
  address: '', city: '', area_sqm: '',
  rent_amount: '', deposit_amount: '',
  status: 'available', description: '',
}

const STATUS_LABELS = {
  available:   { label: 'Disponible',  css: 'lk-badge-success' },
  rented:      { label: 'Loué',        css: 'lk-badge-info' },
  maintenance: { label: 'Maintenance', css: 'lk-badge-warning' },
}

const TYPE_LABELS = {
  apartment:  'Appartement',
  house:      'Maison',
  office:     'Bureau',
  land:       'Terrain',
  commercial: 'Commercial',
}

export default function PropertiesPage() {
  const { show }            = useToast()
  const { user, agency }    = useAuth()
  const isAdmin             = user?.role === 'admin'

  const [data,       setData]       = useState([])
  const [owners,     setOwners]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(false)
  const [editing,    setEditing]    = useState(null)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [error,      setError]      = useState('')
  const [saving,     setSaving]     = useState(false)
  const [planModal,  setPlanModal]  = useState(false)
  const [planMessage,setPlanMessage]= useState('')
  const [statusFilter, setStatusFilter] = useState('all')

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
      const [pRes, oRes] = await Promise.all([
        propertyApi.getAll(),
        ownerApi.getAll(),
      ])
      const raw = pRes.data?.data
      setData(Array.isArray(raw) ? raw : raw?.data || [])
      const rawOwners = oRes.data?.data
      setOwners(Array.isArray(rawOwners) ? rawOwners : [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null); setForm(EMPTY_FORM); setError(''); setModal(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({
      owner_id:       row.owner_id       || '',
      title:          row.title          || '',
      type:           row.type           || 'apartment',
      address:        row.address        || '',
      city:           row.city           || '',
      area_sqm:       row.area_sqm       || '',
      rent_amount:    row.rent_amount    || '',
      deposit_amount: row.deposit_amount || '',
      status:         row.status         || 'available',
      description:    row.description    || '',
    })
    setError(''); setModal(true)
  }

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      if (editing) {
        await propertyApi.update(editing.id, form)
        show('Bien mis à jour', 'success')
      } else {
        await propertyApi.create(form)
        show('Bien créé', 'success')
      }
      setModal(false)
      load()
    } catch (err) {
      if (isPlanLimit(err)) {
        setModal(false)
        setPlanMessage(getPlanLimitMessage(err))
        setPlanModal(true)
      } else {
        const errors = err.response?.data?.errors
        setError(errors
          ? Object.values(errors).flat()[0]
          : err.response?.data?.message || 'Erreur')
      }
    } finally { setSaving(false) }
  }

  const remove = async (id) => {
    if (!window.confirm('Supprimer ce bien ?')) return
    try {
      await propertyApi.delete(id)
      show('Bien supprimé', 'success')
      load()
    } catch {
      show('Erreur lors de la suppression', 'error')
    }
  }

  const exportExcel = () => exportToExcel(
    filtered,
    [
      { key: 'title',          label: 'Titre' },
      { key: 'type',           label: 'Type',        format: v => TYPE_LABELS[v] || v },
      { key: 'owner_name',     label: 'Propriétaire' },
      { key: 'address',        label: 'Adresse' },
      { key: 'city',           label: 'Ville' },
      { key: 'area_sqm',       label: 'Surface (m²)' },
      { key: 'rent_amount',    label: 'Loyer (FCFA)' },
      { key: 'deposit_amount', label: 'Caution (FCFA)' },
      { key: 'status',         label: 'Statut',       format: v => STATUS_LABELS[v]?.label || v },
    ],
    `biens_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}`,
    'Biens immobiliers'
  )

  const exportPdf = () => exportListToPdf(
    filtered,
    [
      { key: 'title',       label: 'Titre' },
      { key: 'type',        label: 'Type',         format: v => TYPE_LABELS[v] || v },
      { key: 'owner_name',  label: 'Propriétaire' },
      { key: 'city',        label: 'Ville' },
      { key: 'area_sqm',    label: 'Surface (m²)' },
      { key: 'rent_amount', label: 'Loyer (FCFA)',
        format: v => new Intl.NumberFormat('fr-FR').format(v) + ' FCFA' },
      { key: 'status',      label: 'Statut',
        format: v => STATUS_LABELS[v]?.label || v },
    ],
    'Liste des biens immobiliers',
    agency
  )

  const columns = [
    {
      key: 'title', label: 'Bien',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-md)',
            background: 'var(--lk-amber-bg)',
            border: '1px solid rgba(212,168,83,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Home size={16} color="var(--lk-amber)" />
          </div>
          <div>
            <div style={{ fontWeight: 500 }}>{val}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--lk-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={11} /> {row.city} · {TYPE_LABELS[row.type]}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'owner_name', label: 'Propriétaire',
      render: val => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--lk-text-secondary)' }}>
          <Building2 size={14} style={{ flexShrink: 0 }} />
          {val || '—'}
        </div>
      ),
    },
    {
      key: 'rent_amount', label: 'Loyer',
      render: val => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--lk-amber)', fontWeight: 500 }}>
          <DollarSign size={13} />
          {formatCurrency(val)}
        </div>
      ),
    },
    {
      key: 'status', label: 'Statut',
      render: val => (
        <span className={`lk-badge ${STATUS_LABELS[val]?.css}`}>
          {STATUS_LABELS[val]?.label}
        </span>
      ),
    },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
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
    <DashboardLayout title="Biens immobiliers" subtitle="Gérez votre portefeuille de biens">

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '1rem',
        flexWrap: 'wrap', gap: '8px',
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
          <SearchBar value={search} onChange={handleSearch} placeholder="Rechercher un bien..." />
          <select
            className="lk-input"
            style={{ width: 'auto', fontSize: '0.875rem' }}
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1) }}
          >
            <option value="all">Tous les statuts</option>
            <option value="available">Disponible</option>
            <option value="rented">Loué</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <ExportButton onExportExcel={exportExcel} onExportPdf={exportPdf} />
          <button
            className="lk-btn lk-btn-primary"
            onClick={openCreate}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={15} /> Nouveau bien
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={paginated}
        loading={loading}
        emptyMessage="Aucun bien enregistré"
        emptyIcon={<Home size={32} style={{ opacity: 0.2 }} />}
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
        title={editing ? 'Modifier le bien' : 'Nouveau bien'}
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
          <label className="lk-label">Propriétaire</label>
          <select className="lk-input" value={form.owner_id}
            onChange={e => setForm({ ...form, owner_id: e.target.value })} required>
            <option value="">Sélectionner un propriétaire</option>
            {owners.map(o => (
              <option key={o.id} value={o.id}>{o.first_name} {o.last_name}</option>
            ))}
          </select>
        </div>

        <div className="lk-input-group">
          <label className="lk-label">Titre</label>
          <input className="lk-input" type="text" placeholder="Appartement F3 Plateau"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })} required />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Type</label>
            <select className="lk-input" value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Statut</label>
            <select className="lk-input" value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="lk-input-group" style={{ marginTop: '1rem' }}>
          <label className="lk-label">Adresse</label>
          <input className="lk-input" type="text" placeholder="Rue 10 Plateau"
            value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })} required />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Ville</label>
            <input className="lk-input" type="text" placeholder="Dakar"
              value={form.city}
              onChange={e => setForm({ ...form, city: e.target.value })} required />
          </div>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Surface (m²)</label>
            <input className="lk-input" type="number" placeholder="80"
              value={form.area_sqm}
              onChange={e => setForm({ ...form, area_sqm: e.target.value })} />
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
            <label className="lk-label">Caution (FCFA)</label>
            <input className="lk-input" type="number" placeholder="300000"
              value={form.deposit_amount}
              onChange={e => setForm({ ...form, deposit_amount: e.target.value })} />
          </div>
        </div>
      </Modal>

      <PlanLimitModal
        isOpen={planModal}
        onClose={() => setPlanModal(false)}
        message={planMessage}
      />

    </DashboardLayout>
  )
}