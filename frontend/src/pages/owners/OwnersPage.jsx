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
import { ownerApi }     from '../../api/ownerApi'
import { exportToExcel }               from '../../utils/excelExport'
import { exportListToPdf }             from '../../utils/pdfExport'
import { usePaginationFilter }         from '../../hooks/usePaginationFilter'
import { isPlanLimit, getPlanLimitMessage } from '../../utils/planLimit'
import {
  Plus, Pencil, Trash2, Globe,
  Building2, Phone, Check, Lock,
} from 'lucide-react'

const EMPTY_FORM = {
  first_name: '', last_name: '', email: '',
  phone: '', address: '', id_card_number: '', notes: '',
}

export default function OwnersPage() {
  const { show }         = useToast()
  const { user, agency } = useAuth()
  const isAdmin          = user?.role === 'admin'

  const [data,         setData]         = useState([])
  const [loading,      setLoading]      = useState(true)
  const [modal,        setModal]        = useState(false)
  const [editing,      setEditing]      = useState(null)
  const [form,         setForm]         = useState(EMPTY_FORM)
  const [error,        setError]        = useState('')
  const [saving,       setSaving]       = useState(false)
  const [planModal,    setPlanModal]    = useState(false)
  const [planMessage,  setPlanMessage]  = useState('')
  const [portalModal,  setPortalModal]  = useState(false)
  const [selectedOwner,setSelectedOwner]= useState(null)
  const [portalForm,   setPortalForm]   = useState({ portal_email: '', portal_password: '' })
  const [portalSaving, setPortalSaving] = useState(false)
  const [portalError,  setPortalError]  = useState('')

  const {
    paginated, filtered, totalPages, currentPage,
    search, setCurrentPage, handleSearch,
  } = usePaginationFilter(data, 8)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await ownerApi.getAll()
      const raw = res.data?.data
      setData(Array.isArray(raw) ? raw : raw?.data || [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null); setForm(EMPTY_FORM); setError(''); setModal(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({
      first_name:     row.first_name     || '',
      last_name:      row.last_name      || '',
      email:          row.email          || '',
      phone:          row.phone          || '',
      address:        row.address        || '',
      id_card_number: row.id_card_number || '',
      notes:          row.notes          || '',
    })
    setError(''); setModal(true)
  }

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      if (editing) {
        await ownerApi.update(editing.id, form)
        show('Propriétaire mis à jour', 'success')
      } else {
        await ownerApi.create(form)
        show('Propriétaire créé', 'success')
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
    if (!window.confirm('Supprimer ce propriétaire ?')) return
    try {
      await ownerApi.delete(id)
      show('Propriétaire supprimé', 'success')
      load()
    } catch { show('Erreur lors de la suppression', 'error') }
  }

  const setupPortal = async (e) => {
    e.preventDefault(); setPortalSaving(true); setPortalError('')
    try {
      await ownerApi.setupPortal(selectedOwner.id, portalForm)
      show('Accès portail activé', 'success')
      setPortalModal(false)
      setPortalForm({ portal_email: '', portal_password: '' })
      load()
    } catch (err) {
      setPortalError(err.response?.data?.message || 'Erreur')
    } finally { setPortalSaving(false) }
  }

  const disablePortal = async () => {
    if (!window.confirm('Désactiver l\'accès portail ?')) return
    try {
      await ownerApi.disablePortal(selectedOwner.id)
      show('Accès portail désactivé', 'success')
      setPortalModal(false); load()
    } catch { show('Erreur', 'error') }
  }

  const exportExcel = () => exportToExcel(
    filtered,
    [
      { key: 'first_name',     label: 'Prénom' },
      { key: 'last_name',      label: 'Nom' },
      { key: 'email',          label: 'Email' },
      { key: 'phone',          label: 'Téléphone' },
      { key: 'address',        label: 'Adresse' },
      { key: 'id_card_number', label: 'N° CNI' },
      { key: 'property_count', label: 'Nb biens' },
    ],
    `proprietaires_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}`,
    'Propriétaires'
  )

  const exportPdf = () => exportListToPdf(
    filtered,
    [
      { key: 'first_name',     label: 'Prénom' },
      { key: 'last_name',      label: 'Nom' },
      { key: 'email',          label: 'Email' },
      { key: 'phone',          label: 'Téléphone' },
      { key: 'property_count', label: 'Nb biens' },
    ],
    'Liste des propriétaires',
    agency
  )

  const columns = [
    {
      key: 'first_name', label: 'Propriétaire',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--lk-amber-bg-2)',
            border: '1px solid rgba(212,168,83,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: 600,
            color: 'var(--lk-amber)', flexShrink: 0,
          }}>
            {row.first_name?.[0]}{row.last_name?.[0]}
          </div>
          <div>
            <div style={{ fontWeight: 500 }}>{row.first_name} {row.last_name}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--lk-text-muted)' }}>
              {row.email || '—'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'phone', label: 'Téléphone',
      render: v => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--lk-text-secondary)' }}>
          <Phone size={13} /> {v || '—'}
        </div>
      ),
    },
    {
      key: 'property_count', label: 'Biens',
      render: v => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Building2 size={13} color="var(--lk-info)" />
          <span className="lk-badge lk-badge-info">
            {v || 0} bien{v > 1 ? 's' : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'portal_active', label: 'Portail',
      render: v => (
        <span style={{
          fontSize: '0.72rem', fontWeight: 500,
          color:      v ? '#3ecf8e' : '#8b8d96',
          background: v ? 'rgba(62,207,142,0.1)' : 'rgba(139,141,150,0.1)',
          borderRadius: '20px', padding: '2px 8px',
          display: 'inline-flex', alignItems: 'center', gap: '4px',
        }}>
          {v ? <><Check size={10} /> Actif</> : <><Lock size={10} /> Inactif</>}
        </span>
      ),
    },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
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
          <button
            className="lk-btn lk-btn-secondary"
            style={{
              padding: '0.3rem 0.75rem', fontSize: '0.8rem',
              display: 'flex', alignItems: 'center', gap: '5px',
              color: row.portal_active ? 'var(--lk-success)' : 'var(--lk-text-muted)',
            }}
            onClick={() => {
              setSelectedOwner(row)
              setPortalForm({ portal_email: row.portal_email || row.email || '', portal_password: '' })
              setPortalError('')
              setPortalModal(true)
            }}
          >
            <Globe size={13} /> Portail
          </button>
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout title="Propriétaires" subtitle="Gérez vos propriétaires">

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '1rem',
        flexWrap: 'wrap', gap: '8px',
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
          <SearchBar value={search} onChange={handleSearch} placeholder="Rechercher un propriétaire..." />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <ExportButton onExportExcel={exportExcel} onExportPdf={exportPdf} />
          <button
            className="lk-btn lk-btn-primary"
            onClick={openCreate}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={15} /> Nouveau propriétaire
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={paginated}
        loading={loading}
        emptyMessage="Aucun propriétaire enregistré"
        emptyIcon={<Building2 size={32} style={{ opacity: 0.2 }} />}
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
        title={editing ? 'Modifier le propriétaire' : 'Nouveau propriétaire'}
        footer={
          <>
            <button className="lk-btn lk-btn-secondary" onClick={() => setModal(false)}>Annuler</button>
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Prénom</label>
            <input className="lk-input" type="text" placeholder="Moussa"
              value={form.first_name}
              onChange={e => setForm({ ...form, first_name: e.target.value })} required />
          </div>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Nom</label>
            <input className="lk-input" type="text" placeholder="Diallo"
              value={form.last_name}
              onChange={e => setForm({ ...form, last_name: e.target.value })} required />
          </div>
        </div>

        <div className="lk-input-group" style={{ marginTop: '1rem' }}>
          <label className="lk-label">Email</label>
          <input className="lk-input" type="email" placeholder="moussa@email.com"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Téléphone</label>
            <input className="lk-input" type="text" placeholder="771234567"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">N° CNI</label>
            <input className="lk-input" type="text" placeholder="1234567890123"
              value={form.id_card_number}
              onChange={e => setForm({ ...form, id_card_number: e.target.value })} />
          </div>
        </div>

        <div className="lk-input-group" style={{ marginTop: '1rem' }}>
          <label className="lk-label">Adresse</label>
          <input className="lk-input" type="text" placeholder="Rue 10, Dakar"
            value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })} />
        </div>
      </Modal>

      {/* Modal Portail */}
      <Modal
        isOpen={portalModal}
        onClose={() => setPortalModal(false)}
        title={`Portail — ${selectedOwner?.first_name} ${selectedOwner?.last_name}`}
        footer={
          <>
            <button className="lk-btn lk-btn-secondary" onClick={() => setPortalModal(false)}>
              Annuler
            </button>
            {selectedOwner?.portal_active && (
              <button className="lk-btn lk-btn-danger" onClick={disablePortal}>
                <Lock size={13} /> Désactiver
              </button>
            )}
            <button
              className="lk-btn lk-btn-primary"
              onClick={setupPortal}
              disabled={portalSaving}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {portalSaving
                ? <Spinner size="sm" />
                : <><Globe size={13} /> {selectedOwner?.portal_active ? 'Mettre à jour' : 'Activer'}</>
              }
            </button>
          </>
        }
      >
        <Alert type="error" message={portalError} onClose={() => setPortalError('')} />

        {selectedOwner?.portal_active && (
          <div style={{
            padding: '0.75rem 1rem',
            background: 'var(--lk-success-bg)',
            color: 'var(--lk-success)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            marginBottom: '1rem',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <Check size={15} /> Accès portail actif
          </div>
        )}

        <div className="lk-input-group">
          <label className="lk-label">Email de connexion</label>
          <input
            className="lk-input" type="email"
            placeholder={selectedOwner?.email || 'email@exemple.com'}
            value={portalForm.portal_email}
            onChange={e => setPortalForm({ ...portalForm, portal_email: e.target.value })}
            required
          />
        </div>

        <div className="lk-input-group">
          <label className="lk-label">
            {selectedOwner?.portal_active ? 'Nouveau mot de passe' : 'Mot de passe'}
          </label>
          <input
            className="lk-input" type="password" placeholder="••••••"
            value={portalForm.portal_password}
            onChange={e => setPortalForm({ ...portalForm, portal_password: e.target.value })}
            required
          />
        </div>

        <div style={{
          padding: '0.75rem 1rem', background: 'var(--lk-dark-3)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.8rem', color: 'var(--lk-text-secondary)',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <Globe size={13} color="var(--lk-amber)" />
          Lien portail :
          <span style={{ color: 'var(--lk-amber)', marginLeft: '4px' }}>
            {window.location.origin}/owner/login
          </span>
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