import { useEffect, useState }  from 'react'
import DashboardLayout           from '../../components/layout/DashboardLayout'
import Alert                     from '../../components/ui/Alert'
import Spinner                   from '../../components/ui/Spinner'
import { useToast }              from '../../context/ToastContext'
import { useAuth }               from '../../context/AuthContext'
import { agencyApi }             from '../../api/agencyApi'
import axiosInstance             from '../../api/axiosInstance'
import { billingApi }            from '../../api/billingApi'
import {
  Save, Upload, Building2, CreditCard,
  Bell, Mail, Smartphone, Palette,
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/lokimmo/backend/public'

export default function ProfilePage() {
  const { show }              = useToast()
  const { user, refreshAgency } = useAuth()
  const isAdmin               = user?.role === 'admin'

  const [loading,       setLoading]       = useState(true)
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState('')
  const [planInfo,      setPlanInfo]      = useState(null)
  const [logoFile,      setLogoFile]      = useState(null)
  const [logoPreview,   setLogoPreview]   = useState(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [testEmail,     setTestEmail]     = useState('')
  const [testPhone,     setTestPhone]     = useState('')
  const [testingEmail,  setTestingEmail]  = useState(false)
  const [testingSms,    setTestingSms]    = useState(false)

  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '',
    website: '', primary_color: '#d4a853', secondary_color: '#0f1117',
  })

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [profileRes, planRes] = await Promise.all([
          agencyApi.getProfile(),
          billingApi.getCurrentPlan(),
        ])
        const agencyData = profileRes.data.data
        setForm({
          name:            agencyData.name            || '',
          email:           agencyData.email           || '',
          phone:           agencyData.phone           || '',
          address:         agencyData.address         || '',
          website:         agencyData.website         || '',
          primary_color:   agencyData.primary_color   || '#d4a853',
          secondary_color: agencyData.secondary_color || '#0f1117',
        })
        setLogoPreview(agencyData.logo_url
          ? `${API_URL}${agencyData.logo_url}` : null)
        setPlanInfo(planRes.data.data)
      } catch (err) {
        console.error('Erreur chargement profil:', err)
        setError('Erreur chargement profil')
      } finally { setLoading(false) }
    }
    loadAll()
  }, [])

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      await agencyApi.updateProfile(form)
      await refreshAgency()
      show('Profil mis à jour', 'success')
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur')
    } finally { setSaving(false) }
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const uploadLogo = async () => {
    if (!logoFile) return
    setUploadingLogo(true)
    try {
      await agencyApi.uploadLogo(logoFile)
      await refreshAgency()
      show('Logo mis à jour', 'success')
      setLogoFile(null)
    } catch (err) {
      show(err.response?.data?.message || 'Erreur upload', 'error')
    } finally { setUploadingLogo(false) }
  }

  const sendTestEmail = async () => {
    if (!testEmail) return
    setTestingEmail(true)
    try {
      await axiosInstance.post('/api/notifications/test-email', { email: testEmail })
      show('Email de test envoyé !', 'success')
    } catch (err) {
      show(err.response?.data?.message || 'Erreur envoi email', 'error')
    } finally { setTestingEmail(false) }
  }

  const sendTestSms = async () => {
    if (!testPhone) return
    setTestingSms(true)
    try {
      await axiosInstance.post('/api/notifications/test-sms', { phone: testPhone })
      show('SMS de test envoyé !', 'success')
    } catch (err) {
      show(err.response?.data?.message || 'Erreur envoi SMS', 'error')
    } finally { setTestingSms(false) }
  }

  if (loading) return (
    <DashboardLayout title="Profil agence">
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <Spinner size="lg" />
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout title="Profil agence" subtitle="Personnalisez votre espace Lokimmo">
      <div style={{ maxWidth: '720px' }}>

        {/* ── Logo ── */}
        <div className="lk-card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{
            fontFamily: 'var(--font-body)', fontSize: '0.875rem',
            fontWeight: 500, color: 'var(--lk-text-secondary)',
            marginBottom: '1.25rem',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <Building2 size={15} /> Logo de l'agence
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{
              width: 80, height: 80,
              borderRadius: 'var(--radius-lg)',
              background: 'var(--lk-dark-3)',
              border: '1px solid var(--lk-border-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', flexShrink: 0,
            }}>
              {logoPreview ? (
                <img src={logoPreview} alt="Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Building2 size={28} style={{ opacity: 0.2 }} />
              )}
            </div>

            <div>
              <input
                type="file" id="logo-input" accept="image/*"
                onChange={handleLogoChange}
                style={{ display: 'none' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <label
                  htmlFor="logo-input"
                  className="lk-btn lk-btn-secondary"
                  style={{ cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Upload size={13} /> Choisir un fichier
                </label>
                {logoFile && (
                  <button
                    className="lk-btn lk-btn-primary"
                    style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                    onClick={uploadLogo}
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? <Spinner size="sm" /> : <><Upload size={13} /> Uploader</>}
                  </button>
                )}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--lk-text-muted)', marginTop: '6px' }}>
                JPG, PNG, WEBP ou SVG — 2MB maximum
              </p>
            </div>
          </div>
        </div>

        {/* ── Formulaire ── */}
        <div className="lk-card">
          <h3 style={{
            fontFamily: 'var(--font-body)', fontSize: '0.875rem',
            fontWeight: 500, color: 'var(--lk-text-secondary)',
            marginBottom: '1.25rem',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <Building2 size={15} /> Informations générales
          </h3>

          <Alert type="error" message={error} onClose={() => setError('')} />

          <form onSubmit={save}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="lk-input-group" style={{ marginBottom: 0 }}>
                <label className="lk-label">Nom de l'agence</label>
                <input className="lk-input" type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  disabled={!isAdmin} required />
              </div>
              <div className="lk-input-group" style={{ marginBottom: 0 }}>
                <label className="lk-label">Email</label>
                <input className="lk-input" type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  disabled={!isAdmin} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div className="lk-input-group" style={{ marginBottom: 0 }}>
                <label className="lk-label">Téléphone</label>
                <input className="lk-input" type="text" placeholder="77 123 45 67"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  disabled={!isAdmin} />
              </div>
              <div className="lk-input-group" style={{ marginBottom: 0 }}>
                <label className="lk-label">Site web</label>
                <input className="lk-input" type="url" placeholder="https://agence.com"
                  value={form.website}
                  onChange={e => setForm({ ...form, website: e.target.value })}
                  disabled={!isAdmin} />
              </div>
            </div>

            <div className="lk-input-group" style={{ marginTop: '1rem' }}>
              <label className="lk-label">Adresse</label>
              <input className="lk-input" type="text" placeholder="Rue 10, Plateau, Dakar"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                disabled={!isAdmin} />
            </div>

            <div className="lk-divider" />

            {/* Thème */}
            <h3 style={{
              fontFamily: 'var(--font-body)', fontSize: '0.875rem',
              fontWeight: 500, color: 'var(--lk-text-secondary)',
              marginBottom: '1.25rem',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <Palette size={15} /> Thème de l'interface
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="lk-input-group" style={{ marginBottom: 0 }}>
                <label className="lk-label">Couleur principale</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="color" value={form.primary_color}
                    onChange={e => setForm({ ...form, primary_color: e.target.value })}
                    disabled={!isAdmin}
                    style={{
                      width: 44, height: 44,
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--lk-border-2)',
                      background: 'none', cursor: 'pointer', padding: '2px',
                    }} />
                  <input className="lk-input" type="text"
                    value={form.primary_color}
                    onChange={e => setForm({ ...form, primary_color: e.target.value })}
                    disabled={!isAdmin}
                    style={{ fontFamily: 'monospace', fontSize: '0.85rem' }} />
                </div>
              </div>

              <div className="lk-input-group" style={{ marginBottom: 0 }}>
                <label className="lk-label">Couleur secondaire (fond)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="color" value={form.secondary_color}
                    onChange={e => setForm({ ...form, secondary_color: e.target.value })}
                    disabled={!isAdmin}
                    style={{
                      width: 44, height: 44,
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--lk-border-2)',
                      background: 'none', cursor: 'pointer', padding: '2px',
                    }} />
                  <input className="lk-input" type="text"
                    value={form.secondary_color}
                    onChange={e => setForm({ ...form, secondary_color: e.target.value })}
                    disabled={!isAdmin}
                    style={{ fontFamily: 'monospace', fontSize: '0.85rem' }} />
                </div>
              </div>
            </div>

            {/* Preview thème */}
            <div style={{
              marginTop: '1rem', padding: '1rem',
              background: form.secondary_color,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--lk-border)',
              display: 'flex', alignItems: 'center', gap: '1rem',
            }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: '1.1rem',
                color: form.primary_color, fontWeight: 600,
              }}>
                Lokimmo
              </div>
              <div style={{
                padding: '4px 12px',
                background: `${form.primary_color}20`,
                border: `1px solid ${form.primary_color}40`,
                borderRadius: '20px', fontSize: '0.75rem',
                color: form.primary_color,
              }}>
                Aperçu du thème
              </div>
              <button type="button" style={{
                padding: '6px 14px',
                background: form.primary_color,
                color: '#0f1117', border: 'none',
                borderRadius: '8px', fontSize: '0.8rem',
                fontWeight: 500, cursor: 'pointer',
              }}>
                Bouton exemple
              </button>
            </div>

            {isAdmin && (
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  className="lk-btn lk-btn-primary"
                  disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {saving ? <Spinner size="sm" /> : <><Save size={14} /> Enregistrer les modifications</>}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* ── Plan actuel ── */}
        <div className="lk-card" style={{ marginTop: '1.5rem' }}>
          <h3 style={{
            fontFamily: 'var(--font-body)', fontSize: '0.875rem',
            fontWeight: 500, color: 'var(--lk-text-secondary)',
            marginBottom: '1rem',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <CreditCard size={15} /> Plan actuel
          </h3>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'var(--lk-amber-bg)',
            border: '1px solid rgba(212,168,83,0.2)',
            borderRadius: '20px', padding: '3px 12px',
            fontSize: '0.75rem', color: 'var(--lk-amber)', fontWeight: 500,
          }}>
            <CreditCard size={12} />
            Plan {planInfo?.current_plan?.plan_name || 'Free'}
            {planInfo?.current_plan?.expires_at && (
              <span style={{ color: 'var(--lk-text-muted)', fontSize: '0.68rem' }}>
                — expire le {new Date(planInfo.current_plan.expires_at).toLocaleDateString('fr-FR')}
              </span>
            )}
          </div>
        </div>

        {/* ── Test notifications ── */}
        {isAdmin && (
          <div className="lk-card" style={{ marginTop: '1.5rem' }}>
            <h3 style={{
              fontSize: '0.875rem', fontWeight: 500,
              marginBottom: '1rem', color: 'var(--lk-text-secondary)',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <Bell size={15} /> Tester les notifications
            </h3>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '0.75rem' }}>
              <input
                className="lk-input" type="email" placeholder="Email de test"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                className="lk-btn lk-btn-secondary"
                onClick={sendTestEmail}
                disabled={testingEmail || !testEmail}
                style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                {testingEmail ? <Spinner size="sm" /> : <><Mail size={13} /> Tester email</>}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                className="lk-input" type="tel" placeholder="Numéro SMS (771577587)"
                value={testPhone}
                onChange={e => setTestPhone(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                className="lk-btn lk-btn-secondary"
                onClick={sendTestSms}
                disabled={testingSms || !testPhone}
                style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                {testingSms ? <Spinner size="sm" /> : <><Smartphone size={13} /> Tester SMS</>}
              </button>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--lk-text-muted)', marginTop: '0.5rem' }}>
              Configurez SMTP et Africa's Talking dans le fichier .env du backend
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}