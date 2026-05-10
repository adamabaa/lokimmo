import { useEffect, useState }    from 'react'
import { useTenantPortal }        from '../../context/TenantPortalContext'
import { portalApi }              from '../../api/portalApi'
import { formatCurrency }         from '../../utils/formatCurrency'
import { formatDate }             from '../../utils/formatDate'
import { generatePdfFromElement } from '../../utils/pdfGenerator'
import ReceiptTemplate            from '../../components/pdf/ReceiptTemplate'
import Spinner                    from '../../components/ui/Spinner'
import {
  Home, FileText, Wallet, User,
  LogOut, Download, Receipt,
  Clock, CheckCircle, AlertCircle,
  Building2, Phone, Mail,
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/lokimmo/backend/public'

const STATUS_LABELS = {
  pending: { label: 'En attente', color: '#d4a853' },
  paid:    { label: 'Payé',       color: '#3ecf8e' },
  partial: { label: 'Partiel',    color: '#5b9cf6' },
  late:    { label: 'En retard',  color: '#e5534b' },
}

const MONTHS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
]

export default function TenantDashboardPage() {
  const { tenant, agency, logout } = useTenantPortal()

  const [contract,       setContract]       = useState(null)
  const [payments,       setPayments]       = useState([])
  const [loading,        setLoading]        = useState(true)
  const [activeTab,      setActiveTab]      = useState('overview')
  const [receiptPayment, setReceiptPayment] = useState(null)
  const [generating,     setGenerating]     = useState(false)

  const primaryColor = agency?.primary_color || '#3ecf8e'

  useEffect(() => {
    Promise.all([
      portalApi.contract().catch(() => ({ data: { data: null } })),
      portalApi.payments(),
    ]).then(([contractRes, paymentsRes]) => {
      setContract(contractRes.data.data)
      const raw = paymentsRes.data?.data
      setPayments(Array.isArray(raw) ? raw : raw?.data || [])
    }).finally(() => setLoading(false))
  }, [])

  const downloadReceipt = async (payment) => {
    setReceiptPayment(payment)
    setGenerating(true)
    setTimeout(async () => {
      try {
        await generatePdfFromElement(
          'receipt-template',
          `quittance_${MONTHS[(payment.period_month || 1) - 1]}_${payment.period_year}.pdf`
        )
      } finally {
        setGenerating(false)
        setReceiptPayment(null)
      }
    }, 500)
  }

  const downloadContract = async () => {
    setGenerating(true)
    setTimeout(async () => {
      try {
        await generatePdfFromElement(
          'portal-contract-template',
          `contrat_${contract?.property_title?.replace(/\s/g, '_') || 'bail'}.pdf`
        )
      } finally { setGenerating(false) }
    }, 500)
  }

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#0f1117',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Spinner size="lg" />
    </div>
  )

  const TABS = [
    { id: 'overview', label: 'Aperçu',       icon: <Home     size={14} /> },
    { id: 'contract', label: 'Mon contrat',  icon: <FileText size={14} /> },
    { id: 'payments', label: 'Mes paiements',icon: <Wallet   size={14} /> },
    { id: 'profile',  label: 'Mon profil',   icon: <User     size={14} /> },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', color: '#f0ece4' }}>

      {/* Header */}
      <header style={{
        background: '#161920', borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 2rem', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {agency?.logo_url ? (
            <img src={`${API_URL}${agency.logo_url}`} alt={agency?.name}
              style={{ height: 32, objectFit: 'contain' }} />
          ) : (
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: '1.2rem',
              fontWeight: 600, color: primaryColor,
            }}>
              {agency?.name || 'Lokimmo'}
            </div>
          )}
          <div style={{
            background: `${primaryColor}15`, border: `1px solid ${primaryColor}30`,
            borderRadius: '20px', padding: '2px 10px',
            fontSize: '0.72rem', color: primaryColor,
          }}>
            Espace Locataire
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '0.875rem', color: '#8b8d96' }}>
            {tenant?.first_name} {tenant?.last_name}
          </div>
          <button
            onClick={logout}
            style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px', padding: '6px 12px',
              color: '#8b8d96', fontSize: '0.8rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <LogOut size={14} /> Déconnexion
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '4px',
          background: '#161920', borderRadius: '10px', padding: '4px',
          marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.07)',
        }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: 1, padding: '0.5rem',
              background:   activeTab === tab.id ? `${primaryColor}20` : 'transparent',
              border:       `1px solid ${activeTab === tab.id ? `${primaryColor}40` : 'transparent'}`,
              borderRadius: '8px',
              color:        activeTab === tab.id ? primaryColor : '#8b8d96',
              fontSize:     '0.8rem', fontWeight: activeTab === tab.id ? 500 : 400,
              cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── Aperçu ── */}
        {activeTab === 'overview' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem', marginBottom: '1.5rem',
            }}>
              {[
                { label: 'Loyer mensuel',   value: formatCurrency(contract?.rent_amount),                      color: primaryColor,  icon: <Wallet       size={16} /> },
                { label: 'Paiements total', value: payments.length,                                              color: '#5b9cf6',    icon: <FileText     size={16} /> },
                { label: 'Payés',           value: payments.filter(p => p.status === 'paid').length,            color: '#3ecf8e',    icon: <CheckCircle  size={16} /> },
                { label: 'En retard',       value: payments.filter(p => p.status === 'late').length,            color: '#e5534b',    icon: <AlertCircle  size={16} /> },
              ].map((card, i) => (
                <div key={i} style={{
                  background: '#161920', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '12px', padding: '1.25rem',
                  position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    height: '2px', background: `linear-gradient(90deg, ${card.color}, transparent)`,
                  }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.72rem', color: '#8b8d96', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {card.label}
                    </div>
                    <span style={{ color: card.color }}>{card.icon}</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)', color: '#f0ece4', fontWeight: 500 }}>
                    {card.value ?? '—'}
                  </div>
                </div>
              ))}
            </div>

            {contract && (
              <div style={{
                background: '#161920', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem',
              }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '1rem', color: primaryColor, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Home size={16} /> Mon logement
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
                  {[
                    { label: 'Bien',          value: contract.property_title },
                    { label: 'Adresse',       value: `${contract.property_address || ''}, ${contract.property_city || ''}` },
                    { label: 'Début',         value: formatDate(contract.start_date) },
                    { label: 'Fin',           value: contract.end_date ? formatDate(contract.end_date) : 'Indéterminée' },
                    { label: 'Loyer',         value: formatCurrency(contract.rent_amount) },
                    { label: 'Jour paiement', value: `Le ${contract.payment_day} du mois` },
                  ].map((item, i) => (
                    <div key={i}>
                      <div style={{ color: '#8b8d96', fontSize: '0.75rem', marginBottom: '2px' }}>{item.label}</div>
                      <div style={{ color: '#f0ece4', fontWeight: 500 }}>{item.value || '—'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{
              background: '#161920', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '12px', padding: '1.5rem',
            }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', marginBottom: '1rem', color: '#f0ece4', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} /> Derniers paiements
              </h3>
              {payments.slice(0, 3).map((p, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.75rem 0',
                  borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                      {MONTHS[(p.period_month || 1) - 1]} {p.period_year}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#8b8d96' }}>
                      Échéance : {formatDate(p.due_date)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                      {formatCurrency(p.amount_paid)}
                    </div>
                    <span style={{
                      fontSize: '0.72rem', fontWeight: 500,
                      color:      STATUS_LABELS[p.status]?.color,
                      background: `${STATUS_LABELS[p.status]?.color}15`,
                      borderRadius: '20px', padding: '1px 8px',
                    }}>
                      {STATUS_LABELS[p.status]?.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Contrat ── */}
        {activeTab === 'contract' && contract && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{
              background: '#161920', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '12px', padding: '1.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: primaryColor, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} /> Contrat de bail
                </h3>
                <span style={{
                  background: 'rgba(62,207,142,0.1)', color: '#3ecf8e',
                  borderRadius: '20px', padding: '4px 12px',
                  fontSize: '0.75rem', fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                  <CheckCircle size={12} /> Actif
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', fontSize: '0.875rem' }}>
                {[
                  { label: 'Bien loué',         value: contract.property_title },
                  { label: 'Adresse',            value: `${contract.property_address || ''}, ${contract.property_city || ''}` },
                  { label: 'Date de début',      value: formatDate(contract.start_date) },
                  { label: 'Date de fin',        value: contract.end_date ? formatDate(contract.end_date) : 'Indéterminée' },
                  { label: 'Loyer mensuel',      value: formatCurrency(contract.rent_amount) },
                  { label: 'Dépôt de garantie', value: formatCurrency(contract.deposit_amount) },
                  { label: 'Jour de paiement',  value: `Le ${contract.payment_day} de chaque mois` },
                  { label: 'Agence',             value: contract.agency_name },
                ].map((item, i) => (
                  <div key={i} style={{ background: '#1e2128', borderRadius: '8px', padding: '0.75rem' }}>
                    <div style={{ color: '#8b8d96', fontSize: '0.72rem', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {item.label}
                    </div>
                    <div style={{ color: '#f0ece4', fontWeight: 500 }}>{item.value || '—'}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <button
                  onClick={downloadContract}
                  disabled={generating}
                  style={{
                    padding: '0.6rem 1.25rem',
                    background: `${primaryColor}15`, border: `1px solid ${primaryColor}30`,
                    borderRadius: '8px', color: primaryColor,
                    fontSize: '0.875rem', cursor: generating ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    opacity: generating ? 0.7 : 1,
                  }}
                >
                  {generating ? <Spinner size="sm" /> : <Download size={14} />}
                  Télécharger contrat PDF
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Paiements ── */}
        {activeTab === 'payments' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{
              background: '#161920', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '12px', overflow: 'hidden',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#13171f', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Période', 'Montant dû', 'Montant payé', 'Échéance', 'Statut', ''].map(h => (
                      <th key={h} style={{
                        padding: '0.85rem 1rem', textAlign: 'left',
                        fontSize: '0.7rem', color: '#555761',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#8b8d96' }}>
                        <Wallet size={32} style={{ opacity: 0.2, display: 'block', margin: '0 auto 0.5rem' }} />
                        Aucun paiement enregistré
                      </td>
                    </tr>
                  ) : payments.map((p, i) => (
                    <tr key={i}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 500 }}>
                        {MONTHS[(p.period_month || 1) - 1]} {p.period_year}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#8b8d96' }}>
                        {formatCurrency(p.amount_due)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#3ecf8e', fontWeight: 500 }}>
                        {formatCurrency(p.amount_paid)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#8b8d96', fontSize: '0.8rem' }}>
                        {formatDate(p.due_date)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          color:        STATUS_LABELS[p.status]?.color,
                          background:   `${STATUS_LABELS[p.status]?.color}15`,
                          borderRadius: '20px', padding: '3px 10px',
                          fontSize: '0.75rem', fontWeight: 500,
                        }}>
                          {STATUS_LABELS[p.status]?.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {['paid', 'partial'].includes(p.status) && (
                          <button
                            onClick={() => downloadReceipt(p)}
                            disabled={generating}
                            style={{
                              padding: '0.3rem 0.75rem',
                              background: `${primaryColor}15`, border: `1px solid ${primaryColor}30`,
                              borderRadius: '6px', color: primaryColor,
                              fontSize: '0.75rem', cursor: generating ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', gap: '5px',
                            }}
                          >
                            {generating ? <Spinner size="sm" /> : <Receipt size={12} />}
                            Quittance
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

        {/* ── Profil ── */}
        {activeTab === 'profile' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{
              background: '#161920', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '12px', padding: '1.5rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%',
                  background: `${primaryColor}20`, border: `2px solid ${primaryColor}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem', fontWeight: 600, color: primaryColor,
                }}>
                  {tenant?.first_name?.[0]}{tenant?.last_name?.[0]}
                </div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>
                    {tenant?.first_name} {tenant?.last_name}
                  </div>
                  <div style={{ color: '#8b8d96', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Mail size={13} /> {tenant?.email}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                {[
                  { label: 'Téléphone',         value: tenant?.phone },
                  { label: 'Profession',         value: tenant?.profession },
                  { label: 'Revenu mensuel',     value: tenant?.monthly_income ? formatCurrency(tenant.monthly_income) : null },
                  {
                    label: 'Score locatif',
                    value: tenant?.score
                      ? `${tenant.score}/100 — ${
                          tenant.score >= 80 ? 'Excellent' :
                          tenant.score >= 60 ? 'Bon' :
                          tenant.score >= 40 ? 'Acceptable' :
                          tenant.score >= 20 ? 'Risqué' : 'Insuffisant'
                        }`
                      : null,
                  },
                  { label: 'Dernière connexion', value: formatDate(tenant?.last_portal_login) },
                ].map((item, i) => (
                  <div key={i} style={{ background: '#1e2128', borderRadius: '8px', padding: '0.75rem' }}>
                    <div style={{ color: '#8b8d96', fontSize: '0.72rem', marginBottom: '4px', textTransform: 'uppercase' }}>
                      {item.label}
                    </div>
                    <div style={{ color: '#f0ece4', fontWeight: 500 }}>{item.value || '—'}</div>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: '1.5rem', padding: '1rem',
                background: `${primaryColor}08`, border: `1px solid ${primaryColor}20`,
                borderRadius: '10px',
              }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 500, color: primaryColor, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={14} /> Contacter votre agence
                </div>
                <div style={{ fontSize: '0.875rem', color: '#8b8d96', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>{contract?.agency_name}</span>
                  {contract?.agency_email && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Mail size={12} /> {contract.agency_email}
                    </span>
                  )}
                  {contract?.agency_phone && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Phone size={12} /> {contract.agency_phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Template quittance caché */}
      {receiptPayment && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
          <ReceiptTemplate
            payment={receiptPayment}
            contract={{
              tenant_name:      `${tenant?.first_name} ${tenant?.last_name}`,
              property_title:   contract?.property_title,
              property_address: contract?.property_address,
            }}
            agency={{
              name:          agency?.name,
              email:         agency?.email,
              phone:         agency?.phone,
              address:       agency?.address,
              logo_url:      agency?.logo_url,
              primary_color: agency?.primary_color,
            }}
          />
        </div>
      )}

      {/* Template contrat caché */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
        <div id="portal-contract-template" style={{
          width: '210mm', minHeight: '297mm', padding: '20mm',
          background: '#ffffff', fontFamily: 'Georgia, serif',
          color: '#1a1a1a', fontSize: '11pt', lineHeight: 1.8,
          boxSizing: 'border-box',
        }}>
          {/* En-tête */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-start', marginBottom: '10mm',
            paddingBottom: '6mm',
            borderBottom: `3px solid ${agency?.primary_color || '#d4a853'}`,
          }}>
            <div>
              {agency?.logo_url && (
                <img src={`${API_URL}${agency.logo_url}`} alt={agency?.name}
                  crossOrigin="anonymous"
                  style={{ height: '18mm', marginBottom: '3mm', objectFit: 'contain' }} />
              )}
              <div style={{ fontSize: '14pt', fontWeight: 'bold', color: agency?.primary_color || '#d4a853' }}>
                {agency?.name}
              </div>
              {agency?.phone && (
                <div style={{ fontSize: '9pt', color: '#666' }}>Tél : {agency.phone}</div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '18pt', fontWeight: 'bold', color: agency?.primary_color || '#d4a853', textTransform: 'uppercase' }}>
                Contrat de bail
              </div>
              <div style={{ fontSize: '9pt', color: '#666', marginTop: '2mm' }}>
                Réf : BAIL-{String(contract?.id || 0).padStart(6, '0')}
              </div>
              <div style={{ fontSize: '9pt', color: '#666' }}>
                Date : {formatDate(new Date().toISOString())}
              </div>
            </div>
          </div>

          {/* Parties */}
          <div style={{ marginBottom: '6mm' }}>
            <div style={{ fontWeight: 'bold', color: agency?.primary_color || '#d4a853', marginBottom: '2mm' }}>
              ENTRE LES SOUSSIGNÉS :
            </div>
            <p>
              <strong>Le Bailleur :</strong> {agency?.name}, agence immobilière, ci-après dénommé « le Bailleur »,
            </p>
            <p style={{ marginTop: '3mm' }}>
              <strong>Le Locataire :</strong> {tenant?.first_name} {tenant?.last_name}, ci-après dénommé « le Locataire »,
            </p>
          </div>

          {/* Articles */}
          {[
            { title: 'Article 1 — Objet',
              content: `Le Bailleur loue au Locataire le bien immobilier : ${contract?.property_title || '—'}, sis à ${contract?.property_address || ''}, ${contract?.property_city || ''}.` },
            { title: 'Article 2 — Durée',
              content: `Le présent contrat est consenti pour une durée commençant le ${formatDate(contract?.start_date)}${contract?.end_date ? ` et se terminant le ${formatDate(contract?.end_date)}` : ', à durée indéterminée'}.` },
            { title: 'Article 3 — Loyer',
              content: `Le loyer mensuel est fixé à ${formatCurrency(contract?.rent_amount)}, payable le ${contract?.payment_day || 5} de chaque mois.` },
            { title: 'Article 4 — Dépôt de garantie',
              content: contract?.deposit_amount
                ? `Un dépôt de garantie de ${formatCurrency(contract.deposit_amount)} est versé à la signature.`
                : "Aucun dépôt de garantie n'est exigé." },
            { title: "Article 5 — Obligations du Locataire",
              content: "Le Locataire s'engage à payer le loyer aux échéances convenues, user paisiblement des lieux loués, ne pas sous-louer sans accord écrit du Bailleur." },
            { title: 'Article 6 — Résiliation',
              content: "Le présent contrat pourra être résilié par l'une ou l'autre des parties avec un préavis d'un mois." },
          ].map((article, i) => (
            <div key={i} style={{ marginBottom: '5mm' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '1mm' }}>{article.title}</div>
              <p style={{ margin: 0, textAlign: 'justify' }}>{article.content}</p>
            </div>
          ))}

          {/* Signatures */}
          <div style={{
            marginTop: '10mm', paddingTop: '6mm',
            borderTop: '1px solid #e0e0e0',
            display: 'flex', justifyContent: 'space-between',
          }}>
            <div style={{ textAlign: 'center', width: '45%' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '2mm' }}>Le Bailleur</div>
              <div style={{ fontSize: '9pt', color: '#666', marginBottom: '15mm' }}>{agency?.name}</div>
              <div style={{ borderTop: '1px solid #333', paddingTop: '2mm', fontSize: '9pt', color: '#666' }}>
                Signature et cachet
              </div>
            </div>
            <div style={{ textAlign: 'center', width: '45%' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '2mm' }}>Le Locataire</div>
              <div style={{ fontSize: '9pt', color: '#666', marginBottom: '15mm' }}>
                {tenant?.first_name} {tenant?.last_name}
              </div>
              <div style={{ borderTop: '1px solid #333', paddingTop: '2mm', fontSize: '9pt', color: '#666' }}>
                Signature précédée de « Lu et approuvé »
              </div>
            </div>
          </div>

          {/* Pied de page */}
          <div style={{
            marginTop: '8mm', textAlign: 'center',
            fontSize: '8pt', color: '#999',
            borderTop: `1px solid ${agency?.primary_color || '#d4a853'}40`,
            paddingTop: '3mm',
          }}>
            Document généré par Lokimmo — {new Date().toLocaleDateString('fr-FR')}
          </div>
        </div>
      </div>

    </div>
  )
}