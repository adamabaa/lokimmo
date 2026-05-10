import { useEffect, useState, useCallback } from 'react'
import DashboardLayout  from '../../components/layout/DashboardLayout'
import DataTable        from '../../components/ui/DataTable'
import Modal            from '../../components/ui/Modal'
import Alert            from '../../components/ui/Alert'
import Spinner          from '../../components/ui/Spinner'
import SearchBar        from '../../components/ui/SearchBar'
import Pagination       from '../../components/ui/Pagination'
import ExportButton     from '../../components/ui/ExportButton'
import { useToast }     from '../../context/ToastContext'
import { useAuth }      from '../../context/AuthContext'
import { expenseApi }   from '../../api/expenseApi'
import { propertyApi }  from '../../api/propertyApi'
import { formatCurrency }      from '../../utils/formatCurrency'
import { formatDate }          from '../../utils/formatDate'
import { exportToExcel }       from '../../utils/excelExport'
import { exportListToPdf }     from '../../utils/pdfExport'
import { usePaginationFilter } from '../../hooks/usePaginationFilter'
import {
  Plus, Pencil, Trash2, TrendingDown,
  Home, Minus,
} from 'lucide-react'

const EMPTY_FORM = {
  property_id:  '',
  title:        '',
  amount:       '',
  category:     'maintenance',
  expense_date: new Date().toISOString().split('T')[0],
  notes:        '',
}

const CATEGORY_LABELS = {
  maintenance: { label: 'Entretien',   color: '#5b9cf6' },
  repairs:     { label: 'Réparations', color: '#e5534b' },
  taxes:       { label: 'Taxes',       color: '#d4a853' },
  insurance:   { label: 'Assurance',   color: '#3ecf8e' },
  management:  { label: 'Gestion',     color: '#a78bfa' },
  other:       { label: 'Autre',       color: '#8b8d96' },
}

export default function ExpensesPage() {
  const { show }   = useToast()
  const { agency } = useAuth()

  const [data,       setData]       = useState([])
  const [properties, setProperties] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(false)
  const [editing,    setEditing]    = useState(null)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [error,      setError]      = useState('')
  const [saving,     setSaving]     = useState(false)
  const [catFilter,  setCatFilter]  = useState('all')
  const [propFilter, setPropFilter] = useState('all')

  const customFilter = useCallback((item) => {
    if (catFilter  !== 'all' && item.category    !== catFilter)          return false
    if (propFilter !== 'all' && String(item.property_id) !== propFilter) return false
    return true
  }, [catFilter, propFilter])

  const {
    paginated, filtered, totalPages, currentPage,
    search, setCurrentPage, handleSearch,
  } = usePaginationFilter(data, 10, customFilter)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [expRes, propRes] = await Promise.all([
        expenseApi.getAll(),
        propertyApi.getAll(),
      ])
      const rawE = expRes.data?.data
      const rawP = propRes.data?.data
      setData(Array.isArray(rawE) ? rawE : rawE?.data || [])
      setProperties(Array.isArray(rawP) ? rawP : rawP?.data || [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null); setForm(EMPTY_FORM); setError(''); setModal(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({
      property_id:  row.property_id  || '',
      title:        row.title        || '',
      amount:       row.amount       || '',
      category:     row.category     || 'maintenance',
      expense_date: row.expense_date || '',
      notes:        row.notes        || '',
    })
    setError(''); setModal(true)
  }

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      if (editing) {
        await expenseApi.update(editing.id, form)
        show('Dépense mise à jour', 'success')
      } else {
        await expenseApi.create(form)
        show('Dépense enregistrée', 'success')
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
    if (!window.confirm('Supprimer cette dépense ?')) return
    try {
      await expenseApi.delete(id)
      show('Dépense supprimée', 'success')
      load()
    } catch { show('Erreur lors de la suppression', 'error') }
  }

  const totalFiltered = filtered.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)

  const exportCols = [
    { key: 'property_title', label: 'Bien' },
    { key: 'title',          label: 'Titre' },
    { key: 'category',       label: 'Catégorie', format: v => CATEGORY_LABELS[v]?.label || v },
    { key: 'amount',         label: 'Montant (FCFA)' },
    { key: 'expense_date',   label: 'Date',
      format: v => v ? new Date(v).toLocaleDateString('fr-FR') : '—' },
    { key: 'notes',          label: 'Notes' },
  ]

  const exportExcel = () => exportToExcel(
    filtered, exportCols,
    `depenses_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}`,
    'Dépenses'
  )

  const exportPdf = () => exportListToPdf(
    filtered, exportCols,
    'Liste des dépenses', agency
  )

  const columns = [
    {
      key: 'property_title', label: 'Bien',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 'var(--radius-md)',
            background: 'var(--lk-amber-bg)',
            border: '1px solid rgba(212,168,83,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Home size={14} color="var(--lk-amber)" />
          </div>
          <div>
            <div style={{ fontWeight: 500 }}>{val || '—'}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--lk-text-muted)' }}>
              {row.property_city || ''}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'title', label: 'Dépense',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 500 }}>{val}</div>
          {row.notes && (
            <div style={{
              fontSize: '0.72rem', color: 'var(--lk-text-muted)',
              whiteSpace: 'nowrap', overflow: 'hidden',
              textOverflow: 'ellipsis', maxWidth: '200px',
            }}>
              {row.notes}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'category', label: 'Catégorie',
      render: v => (
        <span style={{
          fontSize: '0.72rem', fontWeight: 500,
          color:        CATEGORY_LABELS[v]?.color,
          background:   `${CATEGORY_LABELS[v]?.color}15`,
          borderRadius: '20px', padding: '2px 10px',
        }}>
          {CATEGORY_LABELS[v]?.label || v}
        </span>
      ),
    },
    {
      key: 'amount', label: 'Montant',
      render: v => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--lk-danger)', fontWeight: 500 }}>
          <Minus size={12} /> {formatCurrency(v)}
        </div>
      ),
    },
    {
      key: 'expense_date', label: 'Date',
      render: v => formatDate(v),
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
          <button
            className="lk-btn lk-btn-danger"
            style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}
            onClick={() => remove(row.id)}
          >
            <Trash2 size={13} /> Supprimer
          </button>
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout title="Dépenses" subtitle="Gérez les dépenses par bien immobilier">

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '1rem',
        flexWrap: 'wrap', gap: '8px',
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
          <SearchBar value={search} onChange={handleSearch} placeholder="Rechercher une dépense..." />

          <select
            className="lk-input"
            style={{ width: 'auto', fontSize: '0.875rem' }}
            value={propFilter}
            onChange={e => { setPropFilter(e.target.value); setCurrentPage(1) }}
          >
            <option value="all">Tous les biens</option>
            {properties.map(p => (
              <option key={p.id} value={String(p.id)}>{p.title}</option>
            ))}
          </select>

          <select
            className="lk-input"
            style={{ width: 'auto', fontSize: '0.875rem' }}
            value={catFilter}
            onChange={e => { setCatFilter(e.target.value); setCurrentPage(1) }}
          >
            <option value="all">Toutes catégories</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <ExportButton onExportExcel={exportExcel} onExportPdf={exportPdf} />
          <button
            className="lk-btn lk-btn-primary"
            onClick={openCreate}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={15} /> Nouvelle dépense
          </button>
        </div>
      </div>

      {/* Total filtré */}
      <div style={{
        display:      'flex',
        alignItems:   'center',
        gap:          '1rem',
        padding:      '0.75rem 1rem',
        background:   'var(--lk-dark-2)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '1rem',
        border:       '1px solid var(--lk-border)',
        flexWrap:     'wrap',
      }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <TrendingDown size={15} color="var(--lk-danger)" />
          <span style={{ fontSize: '0.8rem', color: 'var(--lk-text-muted)' }}>Total dépenses :</span>
          <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--lk-danger)' }}>
            − {formatCurrency(totalFiltered)}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginLeft: 'auto' }}>
          {Object.entries(CATEGORY_LABELS).map(([key, cat]) => {
            const total = filtered
              .filter(e => e.category === key)
              .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
            if (total === 0) return null
            return (
              <div key={key} style={{
                fontSize: '0.72rem', fontWeight: 500,
                color:        cat.color,
                background:   `${cat.color}12`,
                border:       `1px solid ${cat.color}25`,
                borderRadius: '20px', padding: '2px 8px',
              }}>
                {cat.label} : {formatCurrency(total)}
              </div>
            )
          })}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={paginated}
        loading={loading}
        emptyMessage="Aucune dépense enregistrée"
        emptyIcon={<TrendingDown size={32} style={{ opacity: 0.2 }} />}
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
        title={editing ? 'Modifier la dépense' : 'Nouvelle dépense'}
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
              {saving
                ? <Spinner size="sm" />
                : <><Plus size={14} /> {editing ? 'Mettre à jour' : 'Enregistrer'}</>
              }
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
          <label className="lk-label">Titre de la dépense</label>
          <input className="lk-input" type="text" placeholder="Réparation toiture"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })} required />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Montant (FCFA)</label>
            <input className="lk-input" type="number" placeholder="50000"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })} required />
          </div>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Date</label>
            <input className="lk-input" type="date"
              value={form.expense_date}
              onChange={e => setForm({ ...form, expense_date: e.target.value })} required />
          </div>
        </div>

        <div className="lk-input-group" style={{ marginTop: '1rem' }}>
          <label className="lk-label">Catégorie</label>
          <select className="lk-input" value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        <div className="lk-input-group">
          <label className="lk-label">Notes (optionnel)</label>
          <textarea
            className="lk-input" rows={3}
            placeholder="Détails supplémentaires..."
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            style={{ resize: 'vertical', minHeight: '70px' }}
          />
        </div>
      </Modal>

    </DashboardLayout>
  )
}