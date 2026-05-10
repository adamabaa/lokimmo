import { useEffect, useState, useCallback } from 'react'
import DashboardLayout  from '../../components/layout/DashboardLayout'
import DataTable        from '../../components/ui/DataTable'
import Modal            from '../../components/ui/Modal'
import Alert            from '../../components/ui/Alert'
import Spinner          from '../../components/ui/Spinner'
import SearchBar        from '../../components/ui/SearchBar'
import Pagination       from '../../components/ui/Pagination'
import PlanLimitModal   from '../../components/ui/PlanLimitModal'
import { useToast }     from '../../context/ToastContext'
import { useAuth }      from '../../context/AuthContext'
import { userApi }      from '../../api/userApi'
import { formatDate }          from '../../utils/formatDate'
import { usePaginationFilter } from '../../hooks/usePaginationFilter'
import { isPlanLimit, getPlanLimitMessage } from '../../utils/planLimit'
import {
  Plus, Pencil, Trash2, KeyRound,
  UserCheck, UserX, Users, ShieldCheck,
} from 'lucide-react'

const ROLE_STYLES = {
  admin:               { label: 'Admin',              css: 'lk-badge-warning' },
  agent:               { label: 'Agent',              css: 'lk-badge-info' },
  caissier_principal:  { label: 'Caissier Principal', css: 'lk-badge-success' },
  caissier_secondaire: { label: 'Caissier Secondaire',css: 'lk-badge-muted' },
}

const EMPTY_FORM = {
  first_name: '', last_name: '', email: '',
  password: '', password_confirmation: '', role: 'agent',
}

export default function UsersPage() {
  const { show }              = useToast()
  const { user: currentUser } = useAuth()

  const [data,        setData]        = useState([])
  const [loading,     setLoading]     = useState(true)
  const [createModal, setCreateModal] = useState(false)
  const [editModal,   setEditModal]   = useState(false)
  const [resetModal,  setResetModal]  = useState(false)
  const [selected,    setSelected]    = useState(null)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [editForm,    setEditForm]    = useState({ first_name: '', last_name: '', email: '', role: 'agent' })
  const [resetForm,   setResetForm]   = useState({ password: '', password_confirmation: '' })
  const [error,       setError]       = useState('')
  const [saving,      setSaving]      = useState(false)
  const [planModal,   setPlanModal]   = useState(false)
  const [planMessage, setPlanMessage] = useState('')

  const {
    paginated, filtered, totalPages, currentPage,
    search, setCurrentPage, handleSearch,
  } = usePaginationFilter(data, 8)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await userApi.getAll()
      const raw = res.data?.data
      setData(Array.isArray(raw) ? raw : raw?.data || [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const createUser = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await userApi.create(form)
      show('Agent créé avec succès', 'success')
      setCreateModal(false)
      setForm(EMPTY_FORM)
      load()
    } catch (err) {
      if (isPlanLimit(err)) {
        setCreateModal(false)
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

  const updateUser = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await userApi.update(selected.id, editForm)
      show('Agent mis à jour', 'success')
      setEditModal(false)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur')
    } finally { setSaving(false) }
  }

  const toggleUser = async (user) => {
    try {
      await userApi.toggle(user.id)
      show(`Compte ${user.is_active ? 'désactivé' : 'activé'}`, 'success')
      load()
    } catch (err) { show(err.response?.data?.message || 'Erreur', 'error') }
  }

  const resetPassword = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await userApi.resetPassword(selected.id, resetForm)
      show('Mot de passe réinitialisé', 'success')
      setResetModal(false)
      setResetForm({ password: '', password_confirmation: '' })
    } catch (err) {
      const errors = err.response?.data?.errors
      setError(errors
        ? Object.values(errors).flat()[0]
        : err.response?.data?.message || 'Erreur')
    } finally { setSaving(false) }
  }

  const deleteUser = async (user) => {
    if (!window.confirm(`Supprimer l'agent "${user.first_name} ${user.last_name}" ?`)) return
    try {
      await userApi.delete(user.id)
      show('Agent supprimé', 'success')
      load()
    } catch (err) { show(err.response?.data?.message || 'Erreur', 'error') }
  }

  const isCurrentUser = (id) => id === currentUser?.id

  const getRoleColor = (role) => {
    const colors = {
      admin:               'var(--lk-amber)',
      agent:               'var(--lk-info)',
      caissier_principal:  'var(--lk-success)',
      caissier_secondaire: 'var(--lk-text-muted)',
    }
    return colors[role] || 'var(--lk-text-muted)'
  }

  const columns = [
    {
      key: 'first_name', label: 'Agent',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background:   row.role === 'admin' ? 'var(--lk-amber-bg-2)' : 'var(--lk-info-bg)',
            border:       `1px solid ${row.role === 'admin' ? 'rgba(212,168,83,0.2)' : 'rgba(91,156,246,0.2)'}`,
            display:      'flex', alignItems: 'center', justifyContent: 'center',
            fontSize:     '0.8rem', fontWeight: 600,
            color:        getRoleColor(row.role),
            flexShrink:   0,
          }}>
            {row.first_name?.[0]}{row.last_name?.[0]}
          </div>
          <div>
            <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
              {row.first_name} {row.last_name}
              {isCurrentUser(row.id) && (
                <span style={{
                  fontSize: '0.7rem', color: 'var(--lk-amber)',
                  background: 'var(--lk-amber-bg)',
                  borderRadius: '10px', padding: '1px 6px',
                }}>
                  Vous
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--lk-text-muted)' }}>
              {row.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'role', label: 'Rôle',
      render: v => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <ShieldCheck size={13} color={getRoleColor(v)} />
          <span className={`lk-badge ${ROLE_STYLES[v]?.css}`}>
            {ROLE_STYLES[v]?.label}
          </span>
        </div>
      ),
    },
    {
      key: 'is_active', label: 'Statut',
      render: v => (
        <span style={{
          fontSize: '0.72rem', fontWeight: 500,
          color:      v ? '#3ecf8e' : '#e5534b',
          background: v ? 'rgba(62,207,142,0.1)' : 'rgba(229,83,75,0.1)',
          borderRadius: '20px', padding: '2px 8px',
          display: 'inline-flex', alignItems: 'center', gap: '4px',
        }}>
          {v
            ? <><UserCheck size={10} /> Actif</>
            : <><UserX    size={10} /> Inactif</>
          }
        </span>
      ),
    },
    {
      key: 'created_at', label: 'Créé le',
      render: v => formatDate(v),
    },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            className="lk-btn lk-btn-secondary"
            style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}
            onClick={() => {
              setSelected(row)
              setEditForm({ first_name: row.first_name, last_name: row.last_name, email: row.email, role: row.role })
              setError('')
              setEditModal(true)
            }}
          >
            <Pencil size={13} /> Modifier
          </button>
          <button
            className="lk-btn lk-btn-secondary"
            style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}
            onClick={() => {
              setSelected(row)
              setResetForm({ password: '', password_confirmation: '' })
              setError('')
              setResetModal(true)
            }}
          >
            <KeyRound size={13} /> Reset MDP
          </button>
          {!isCurrentUser(row.id) && (
            <button
              className={`lk-btn ${row.is_active ? 'lk-btn-danger' : 'lk-btn-secondary'}`}
              style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}
              onClick={() => toggleUser(row)}
            >
              {row.is_active
                ? <><UserX    size={13} /> Désactiver</>
                : <><UserCheck size={13} /> Activer</>
              }
            </button>
          )}
          {!isCurrentUser(row.id) && (
            <button
              className="lk-btn lk-btn-danger"
              style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}
              onClick={() => deleteUser(row)}
            >
              <Trash2 size={13} /> Supprimer
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout title="Équipe" subtitle="Gérez les agents de votre agence">

      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '1rem',
        flexWrap: 'wrap', gap: '8px',
      }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
          <SearchBar value={search} onChange={handleSearch} placeholder="Rechercher un agent..." />
        </div>
        <button
          className="lk-btn lk-btn-primary"
          onClick={() => { setForm(EMPTY_FORM); setError(''); setCreateModal(true) }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={15} /> Nouvel agent
        </button>
      </div>

      <DataTable
        columns={columns}
        data={paginated}
        loading={loading}
        emptyMessage="Aucun agent enregistré"
        emptyIcon={<Users size={32} style={{ opacity: 0.2 }} />}
        totalCount={filtered.length}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Modal Créer */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="Nouvel agent"
        footer={
          <>
            <button className="lk-btn lk-btn-secondary" onClick={() => setCreateModal(false)}>
              Annuler
            </button>
            <button
              className="lk-btn lk-btn-primary"
              onClick={createUser}
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {saving ? <Spinner size="sm" /> : <><Plus size={14} /> Créer</>}
            </button>
          </>
        }
      >
        <Alert type="error" message={error} onClose={() => setError('')} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Prénom</label>
            <input className="lk-input" type="text" placeholder="Fatou"
              value={form.first_name}
              onChange={e => setForm({ ...form, first_name: e.target.value })} required />
          </div>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Nom</label>
            <input className="lk-input" type="text" placeholder="Sow"
              value={form.last_name}
              onChange={e => setForm({ ...form, last_name: e.target.value })} required />
          </div>
        </div>

        <div className="lk-input-group" style={{ marginTop: '1rem' }}>
          <label className="lk-label">Email</label>
          <input className="lk-input" type="email" placeholder="fatou@agence.com"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })} required />
        </div>

        <div className="lk-input-group">
          <label className="lk-label">Rôle</label>
          <select className="lk-input" value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}>
            <option value="agent">Agent</option>
            <option value="admin">Admin</option>
            <option value="caissier_principal">Caissier Principal</option>
            <option value="caissier_secondaire">Caissier Secondaire</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Mot de passe</label>
            <input className="lk-input" type="password" placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Confirmation</label>
            <input className="lk-input" type="password" placeholder="••••••••"
              value={form.password_confirmation}
              onChange={e => setForm({ ...form, password_confirmation: e.target.value })} required />
          </div>
        </div>
      </Modal>

      {/* Modal Modifier */}
      <Modal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        title={`Modifier — ${selected?.first_name} ${selected?.last_name}`}
        footer={
          <>
            <button className="lk-btn lk-btn-secondary" onClick={() => setEditModal(false)}>
              Annuler
            </button>
            <button
              className="lk-btn lk-btn-primary"
              onClick={updateUser}
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {saving ? <Spinner size="sm" /> : <><Pencil size={14} /> Mettre à jour</>}
            </button>
          </>
        }
      >
        <Alert type="error" message={error} onClose={() => setError('')} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Prénom</label>
            <input className="lk-input" type="text"
              value={editForm.first_name}
              onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} required />
          </div>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Nom</label>
            <input className="lk-input" type="text"
              value={editForm.last_name}
              onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} required />
          </div>
        </div>

        <div className="lk-input-group" style={{ marginTop: '1rem' }}>
          <label className="lk-label">Email</label>
          <input className="lk-input" type="email"
            value={editForm.email}
            onChange={e => setEditForm({ ...editForm, email: e.target.value })} required />
        </div>

        <div className="lk-input-group">
          <label className="lk-label">Rôle</label>
          <select className="lk-input" value={editForm.role}
            onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
            <option value="agent">Agent</option>
            <option value="admin">Admin</option>
            <option value="caissier_principal">Caissier Principal</option>
            <option value="caissier_secondaire">Caissier Secondaire</option>
          </select>
        </div>
      </Modal>

      {/* Modal Reset MDP */}
      <Modal
        isOpen={resetModal}
        onClose={() => setResetModal(false)}
        title={`Reset MDP — ${selected?.first_name} ${selected?.last_name}`}
        footer={
          <>
            <button className="lk-btn lk-btn-secondary" onClick={() => setResetModal(false)}>
              Annuler
            </button>
            <button
              className="lk-btn lk-btn-danger"
              onClick={resetPassword}
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {saving ? <Spinner size="sm" /> : <><KeyRound size={14} /> Réinitialiser</>}
            </button>
          </>
        }
      >
        <Alert type="error" message={error} onClose={() => setError('')} />

        <div className="lk-input-group">
          <label className="lk-label">Nouveau mot de passe</label>
          <input className="lk-input" type="password" placeholder="••••••••"
            value={resetForm.password}
            onChange={e => setResetForm({ ...resetForm, password: e.target.value })} required />
        </div>
        <div className="lk-input-group">
          <label className="lk-label">Confirmation</label>
          <input className="lk-input" type="password" placeholder="••••••••"
            value={resetForm.password_confirmation}
            onChange={e => setResetForm({ ...resetForm, password_confirmation: e.target.value })} required />
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