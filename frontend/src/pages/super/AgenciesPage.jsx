import { useEffect, useState, useCallback } from 'react'
import SuperAdminLayout  from '../../components/super/SuperAdminLayout'
import { superAdminApi } from '../../api/superAdminApi'
import { useToast }      from '../../context/ToastContext'
import { formatDate }    from '../../utils/formatDate'
import Modal             from '../../components/ui/Modal'
import Alert             from '../../components/ui/Alert'
import Spinner           from '../../components/ui/Spinner'
import {
  Plus, Pencil, Trash2, KeyRound,
  CreditCard, UserCheck, UserX,
  Building2,
} from 'lucide-react'

const PLAN_STYLES = {
  free:    { label: 'Free',    bg: 'rgba(139,141,150,0.1)', color: '#8b8d96' },
  starter: { label: 'Starter', bg: 'rgba(91,156,246,0.1)',  color: '#5b9cf6' },
  pro:     { label: 'Pro',     bg: 'rgba(212,168,83,0.1)',   color: '#d4a853' },
}

const EMPTY_FORM = {
  agency_name: '', agency_slug: '', first_name: '',
  last_name: '', email: '', password: '', plan: 'free',
}

export default function AgenciesPage() {
  const { show }      = useToast()
  const [agencies,    setAgencies]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [createModal, setCreateModal] = useState(false)
  const [editModal,   setEditModal]   = useState(false)
  const [planModal,   setPlanModal]   = useState(false)
  const [resetModal,  setResetModal]  = useState(false)
  const [selected,    setSelected]    = useState(null)
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [editForm,    setEditForm]    = useState({ name: '', email: '', plan: 'free' })
  const [planForm,    setPlanForm]    = useState({ plan: 'free' })
  const [resetForm,   setResetForm]   = useState({ password: '' })
  const [error,       setError]       = useState('')
  const [saving,      setSaving]      = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await superAdminApi.getAgencies()
      const raw = res.data?.data
      setAgencies(Array.isArray(raw) ? raw : raw?.data || [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleNameChange = (val) => {
    const slug = val.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    setForm({ ...form, agency_name: val, agency_slug: slug })
  }

  const createAgency = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await superAdminApi.createAgency(form)
      show('Agence créée avec succès', 'success')
      setCreateModal(false); setForm(EMPTY_FORM); load()
    } catch (err) {
      const errors = err.response?.data?.errors
      setError(errors
        ? Object.values(errors).flat()[0]
        : err.response?.data?.message || 'Erreur')
    } finally { setSaving(false) }
  }

  const updateAgency = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await superAdminApi.updateAgency(selected.id, editForm)
      show('Agence mise à jour', 'success')
      setEditModal(false); load()
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur')
    } finally { setSaving(false) }
  }

  const toggleAgency = async (agency) => {
    try {
      await superAdminApi.toggleAgency(agency.id)
      show(`Agence ${agency.is_active ? 'désactivée' : 'activée'}`, 'success')
      load()
    } catch { show('Erreur', 'error') }
  }

  const deleteAgency = async (agency) => {
    if (!window.confirm(`Supprimer l'agence "${agency.name}" ?`)) return
    try {
      await superAdminApi.deleteAgency(agency.id)
      show('Agence supprimée', 'success'); load()
    } catch { show('Erreur lors de la suppression', 'error') }
  }

  const changePlan = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await superAdminApi.changePlan(selected.id, planForm)
      show('Plan mis à jour', 'success')
      setPlanModal(false); load()
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur')
    } finally { setSaving(false) }
  }

  const resetPassword = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await superAdminApi.resetPassword(selected.id, resetForm)
      show('Mot de passe réinitialisé', 'success')
      setResetModal(false); setResetForm({ password: '' })
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur')
    } finally { setSaving(false) }
  }

  return (
    <SuperAdminLayout title="Agences" subtitle="Gérez toutes les agences de la plateforme">

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '1.5rem',
      }}>
        <div style={{ color: '#8b8d96', fontSize: '0.875rem' }}>
          {agencies.length} agence{agencies.length > 1 ? 's' : ''} enregistrée{agencies.length > 1 ? 's' : ''}
        </div>
        <button
          onClick={() => { setForm(EMPTY_FORM); setError(''); setCreateModal(true) }}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '0.55rem 1.25rem',
            background: '#5b9cf6', color: '#fff',
            border: 'none', borderRadius: '10px',
            fontSize: '0.875rem', fontWeight: 500,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#7ab3f8'}
          onMouseLeave={e => e.currentTarget.style.background = '#5b9cf6'}
        >
          <Plus size={15} /> Nouvelle agence
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Spinner size="lg" />
        </div>
      ) : agencies.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#8b8d96' }}>
          <Building2 size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <p>Aucune agence enregistrée</p>
        </div>
      ) : (
        <div style={{
          background: '#0e1219',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px', overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#13171f', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Agence', 'Slug', 'Plan', 'Users', 'Biens', 'Contrats', 'Statut', 'Créée le', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '0.85rem 1rem', textAlign: 'left',
                    fontSize: '0.7rem', color: '#555761',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {agencies.map((agency, i) => (
                <tr key={agency.id}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    transition: 'background 0.15s',
                    opacity: 0,
                    animation: `fadeIn 0.3s ease forwards ${i * 0.04}s`,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <div style={{ fontWeight: 500, color: '#f0ece4' }}>{agency.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#555761' }}>{agency.email}</div>
                  </td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <span style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '6px', padding: '2px 8px',
                      fontSize: '0.78rem', color: '#8b8d96',
                      fontFamily: 'monospace',
                    }}>
                      {agency.slug}
                    </span>
                  </td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <span style={{
                      background:   PLAN_STYLES[agency.plan]?.bg,
                      color:        PLAN_STYLES[agency.plan]?.color,
                      borderRadius: '20px', padding: '3px 10px',
                      fontSize: '0.75rem', fontWeight: 500,
                    }}>
                      {PLAN_STYLES[agency.plan]?.label || agency.plan}
                    </span>
                  </td>
                  <td style={{ padding: '0.9rem 1rem', color: '#8b8d96' }}>{agency.users_count || 0}</td>
                  <td style={{ padding: '0.9rem 1rem', color: '#8b8d96' }}>{agency.properties_count || 0}</td>
                  <td style={{ padding: '0.9rem 1rem', color: '#8b8d96' }}>{agency.contracts_count || 0}</td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <span style={{
                      background:   agency.is_active ? 'rgba(62,207,142,0.1)' : 'rgba(229,83,75,0.1)',
                      color:        agency.is_active ? '#3ecf8e' : '#e5534b',
                      borderRadius: '20px', padding: '3px 10px',
                      fontSize: '0.75rem', fontWeight: 500,
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                    }}>
                      {agency.is_active
                        ? <><UserCheck size={10} /> Active</>
                        : <><UserX    size={10} /> Inactive</>
                      }
                    </span>
                  </td>
                  <td style={{ padding: '0.9rem 1rem', color: '#555761', fontSize: '0.8rem' }}>
                    {formatDate(agency.created_at)}
                  </td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => {
                          setSelected(agency)
                          setEditForm({ name: agency.name, email: agency.email, plan: agency.plan || 'free' })
                          setError(''); setEditModal(true)
                        }}
                        style={btnStyle('#5b9cf6')}
                      >
                        <Pencil size={11} /> Modifier
                      </button>
                      <button
                        onClick={() => {
                          setSelected(agency)
                          setPlanForm({ plan: agency.plan || 'free' })
                          setError(''); setPlanModal(true)
                        }}
                        style={btnStyle('#d4a853')}
                      >
                        <CreditCard size={11} /> Plan
                      </button>
                      <button
                        onClick={() => {
                          setSelected(agency)
                          setResetForm({ password: '' })
                          setError(''); setResetModal(true)
                        }}
                        style={btnStyle('#8b8d96')}
                      >
                        <KeyRound size={11} /> Reset MDP
                      </button>
                      <button
                        onClick={() => toggleAgency(agency)}
                        style={btnStyle(agency.is_active ? '#e5534b' : '#3ecf8e')}
                      >
                        {agency.is_active
                          ? <><UserX    size={11} /> Désactiver</>
                          : <><UserCheck size={11} /> Activer</>
                        }
                      </button>
                      <button
                        onClick={() => deleteAgency(agency)}
                        style={btnStyle('#e5534b')}
                      >
                        <Trash2 size={11} /> Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Créer */}
      <Modal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        title="Nouvelle agence"
        footer={
          <>
            <button className="lk-btn lk-btn-secondary" onClick={() => setCreateModal(false)}>Annuler</button>
            <button
              onClick={createAgency}
              disabled={saving}
              style={{ ...btnStyle('#5b9cf6'), padding: '0.5rem 1.25rem' }}
            >
              {saving ? <Spinner size="sm" /> : <><Plus size={13} /> Créer</>}
            </button>
          </>
        }
      >
        <Alert type="error" message={error} onClose={() => setError('')} />

        <div className="lk-input-group">
          <label className="lk-label">Nom de l'agence</label>
          <input className="lk-input" type="text" placeholder="Immo Dakar"
            value={form.agency_name}
            onChange={e => handleNameChange(e.target.value)} required />
        </div>

        <div className="lk-input-group">
          <label className="lk-label">Slug</label>
          <input className="lk-input" type="text" placeholder="immo-dakar"
            value={form.agency_slug}
            onChange={e => setForm({ ...form, agency_slug: e.target.value })} required />
          <div style={{ fontSize: '0.75rem', color: '#555761', marginTop: '4px' }}>
            → {form.agency_slug || 'votre-agence'}.lokimmo.com
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Prénom admin</label>
            <input className="lk-input" type="text" placeholder="Moussa"
              value={form.first_name}
              onChange={e => setForm({ ...form, first_name: e.target.value })} required />
          </div>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Nom admin</label>
            <input className="lk-input" type="text" placeholder="Diallo"
              value={form.last_name}
              onChange={e => setForm({ ...form, last_name: e.target.value })} required />
          </div>
        </div>

        <div className="lk-input-group" style={{ marginTop: '1rem' }}>
          <label className="lk-label">Email admin</label>
          <input className="lk-input" type="email" placeholder="admin@immo-dakar.com"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })} required />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Mot de passe</label>
            <input className="lk-input" type="password" placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div className="lk-input-group" style={{ marginBottom: 0 }}>
            <label className="lk-label">Plan</label>
            <select className="lk-input" value={form.plan}
              onChange={e => setForm({ ...form, plan: e.target.value })}>
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Modal Modifier */}
      <Modal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        title={`Modifier — ${selected?.name}`}
        footer={
          <>
            <button className="lk-btn lk-btn-secondary" onClick={() => setEditModal(false)}>Annuler</button>
            <button
              onClick={updateAgency}
              disabled={saving}
              style={{ ...btnStyle('#5b9cf6'), padding: '0.5rem 1.25rem' }}
            >
              {saving ? <Spinner size="sm" /> : <><Pencil size={13} /> Mettre à jour</>}
            </button>
          </>
        }
      >
        <Alert type="error" message={error} onClose={() => setError('')} />
        <div className="lk-input-group">
          <label className="lk-label">Nom</label>
          <input className="lk-input" type="text"
            value={editForm.name}
            onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
        </div>
        <div className="lk-input-group">
          <label className="lk-label">Email</label>
          <input className="lk-input" type="email"
            value={editForm.email}
            onChange={e => setEditForm({ ...editForm, email: e.target.value })} required />
        </div>
      </Modal>

      {/* Modal Plan */}
      <Modal
        isOpen={planModal}
        onClose={() => setPlanModal(false)}
        title={`Changer le plan — ${selected?.name}`}
        footer={
          <>
            <button className="lk-btn lk-btn-secondary" onClick={() => setPlanModal(false)}>Annuler</button>
            <button
              onClick={changePlan}
              disabled={saving}
              style={{ ...btnStyle('#d4a853'), padding: '0.5rem 1.25rem' }}
            >
              {saving ? <Spinner size="sm" /> : <><CreditCard size={13} /> Changer</>}
            </button>
          </>
        }
      >
        <Alert type="error" message={error} onClose={() => setError('')} />
        <div className="lk-input-group">
          <label className="lk-label">Plan</label>
          <select className="lk-input" value={planForm.plan}
            onChange={e => setPlanForm({ plan: e.target.value })}>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
          </select>
        </div>
        <div style={{
          marginTop: '1rem', padding: '0.75rem 1rem',
          background: 'rgba(212,168,83,0.08)',
          border: '1px solid rgba(212,168,83,0.2)',
          borderRadius: '8px', fontSize: '0.8rem', color: '#8b8d96',
        }}>
          Plan actuel : <strong style={{ color: PLAN_STYLES[selected?.plan]?.color }}>
            {PLAN_STYLES[selected?.plan]?.label || selected?.plan}
          </strong>
        </div>
      </Modal>

      {/* Modal Reset MDP */}
      <Modal
        isOpen={resetModal}
        onClose={() => setResetModal(false)}
        title={`Réinitialiser MDP — ${selected?.name}`}
        footer={
          <>
            <button className="lk-btn lk-btn-secondary" onClick={() => setResetModal(false)}>Annuler</button>
            <button
              onClick={resetPassword}
              disabled={saving}
              style={{ ...btnStyle('#e5534b'), padding: '0.5rem 1.25rem' }}
            >
              {saving ? <Spinner size="sm" /> : <><KeyRound size={13} /> Réinitialiser</>}
            </button>
          </>
        }
      >
        <Alert type="error" message={error} onClose={() => setError('')} />
        <div className="lk-input-group">
          <label className="lk-label">Nouveau mot de passe</label>
          <input className="lk-input" type="password" placeholder="••••••••"
            value={resetForm.password}
            onChange={e => setResetForm({ password: e.target.value })} required />
        </div>
      </Modal>

    </SuperAdminLayout>
  )
}

function btnStyle(color) {
  return {
    display:      'inline-flex',
    alignItems:   'center',
    gap:          '4px',
    padding:      '0.25rem 0.6rem',
    background:   `${color}12`,
    color:        color,
    border:       `1px solid ${color}25`,
    borderRadius: '6px',
    fontSize:     '0.75rem',
    fontWeight:   500,
    cursor:       'pointer',
    transition:   'all 0.15s',
    whiteSpace:   'nowrap',
  }
}