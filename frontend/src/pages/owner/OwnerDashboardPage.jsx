import { useEffect, useState }  from 'react'
import { useOwnerPortal }        from '../../context/OwnerPortalContext'
import { ownerPortalApi }        from '../../api/ownerPortalApi'
import { formatCurrency }        from '../../utils/formatCurrency'
import { formatDate }            from '../../utils/formatDate'
import Spinner                   from '../../components/ui/Spinner'
import {
  LogOut, Home, BarChart2, Wallet, User,
  TrendingUp, TrendingDown, ArrowLeft,
  Building2, Phone, Mail, Wrench,
  ChevronRight, UserCheck,
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/lokimmo/backend/public'

const STATUS_LABELS = {
  available:   { label: 'Disponible',  color: '#3ecf8e' },
  rented:      { label: 'Loué',        color: '#5b9cf6' },
  maintenance: { label: 'Maintenance', color: '#d4a853' },
}

const CATEGORY_LABELS = {
  maintenance: 'Entretien',
  repairs:     'Réparations',
  taxes:       'Taxes',
  insurance:   'Assurance',
  management:  'Gestion',
  other:       'Autre',
}

const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

const PAY_STATUS = {
  pending: { label: 'En attente', color: '#d4a853' },
  paid:    { label: 'Payé',       color: '#3ecf8e' },
  partial: { label: 'Partiel',    color: '#5b9cf6' },
  late:    { label: 'En retard',  color: '#e5534b' },
}

const TABS = [
  { id: 'overview',   label: 'Aperçu',          icon: <BarChart2  size={14} /> },
  { id: 'properties', label: 'Mes biens',        icon: <Home       size={14} /> },
  { id: 'finance',    label: 'Bilan financier',  icon: <Wallet     size={14} /> },
  { id: 'profile',    label: 'Mon profil',       icon: <User       size={14} /> },
]

export default function OwnerDashboardPage() {
  const { owner, agency, logout } = useOwnerPortal()

  const [summary,    setSummary]    = useState(null)
  const [properties, setProperties] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [activeTab,  setActiveTab]  = useState('overview')

  const [selectedProperty, setSelectedProperty] = useState(null)
  const [propPayments,     setPropPayments]      = useState([])
  const [propExpenses,     setPropExpenses]      = useState([])
  const [propLoading,      setPropLoading]       = useState(false)
  const [isMobile,         setIsMobile]          = useState(window.innerWidth <= 768)

  const primaryColor = agency?.primary_color || '#d4a853'

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    Promise.all([
      ownerPortalApi.summary(),
      ownerPortalApi.properties(),
    ]).then(([summaryRes, propertiesRes]) => {
      setSummary(summaryRes.data.data)
      const raw = propertiesRes.data?.data
      setProperties(Array.isArray(raw) ? raw : raw?.data || [])
    }).finally(() => setLoading(false))
  }, [])

  const loadPropertyDetail = async (property) => {
    setSelectedProperty(property)
    setActiveTab('property-detail')
    setPropLoading(true)
    try {
      const [paymentsRes, expensesRes] = await Promise.all([
        ownerPortalApi.propertyPayments(property.id),
        ownerPortalApi.propertyExpenses(property.id),
      ])
      const rawP = paymentsRes.data?.data
      const rawE = expensesRes.data?.data
      setPropPayments(Array.isArray(rawP) ? rawP : [])
      setPropExpenses(Array.isArray(rawE) ? rawE : [])
    } finally { setPropLoading(false) }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner size="lg" />
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', color: '#f0ece4' }}>

      {/* Header */}
      <header style={{
        background: '#161920', borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: isMobile ? '0 1rem' : '0 2rem', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {agency?.logo_url ? (
            <img src={`${API_URL}${agency.logo_url}`} alt={agency?.name}
              style={{ height: 32, objectFit: 'contain' }} />
          ) : (
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: primaryColor }}>
              {agency?.name || 'Lokimmo'}
            </div>
          )}
          {!isMobile && (
            <div style={{
              background: `${primaryColor}15`, border: `1px solid ${primaryColor}30`,
              borderRadius: '20px', padding: '2px 10px',
              fontSize: '0.72rem', color: primaryColor,
              display: 'flex', alignItems: 'center', gap: '5px',
            }}>
              <Building2 size={11} /> Espace Propriétaire
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {!isMobile && (
            <div style={{ fontSize: '0.875rem', color: '#8b8d96' }}>
              {owner?.first_name} {owner?.last_name}
            </div>
          )}
          <button
            onClick={logout}
            style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px', padding: isMobile ? '6px' : '6px 12px',
              color: '#8b8d96', fontSize: '0.8rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
            title="Déconnexion"
          >
            <LogOut size={14} /> {!isMobile && 'Déconnexion'}
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1rem' }}>

        {/* Tabs */}
        <div 
          className="lk-scrollbar-hidden"
          style={{
            display: 'flex', gap: '4px',
            background: '#161920', borderRadius: '10px', padding: '4px',
            marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.07)',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: isMobile ? '0 0 auto' : 1,
              padding: isMobile ? '0.5rem 1rem' : '0.5rem',
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Revenus totaux',   value: formatCurrency(summary?.total_revenue),  color: '#3ecf8e',   icon: <TrendingUp   size={16} /> },
                { label: 'Dépenses totales', value: formatCurrency(summary?.total_expenses), color: '#e5534b',   icon: <TrendingDown size={16} /> },
                { label: 'Revenu net',       value: formatCurrency(summary?.net_income),     color: primaryColor,icon: <Wallet       size={16} /> },
                { label: 'Biens total',      value: summary?.properties?.total,              color: '#5b9cf6',   icon: <Home         size={16} /> },
                { label: 'Biens loués',      value: summary?.properties?.rented,             color: '#3ecf8e',   icon: <UserCheck    size={16} /> },
                { label: 'Loyers en retard', value: summary?.late_payments,                  color: '#e5534b',   icon: <BarChart2    size={16} /> },
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
                  <div style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)', color: '#f0ece4', fontWeight: 500 }}>
                    {card.value ?? '—'}
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              background: '#161920', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '12px', overflow: 'hidden',
            }}>
              <div style={{
                padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
                fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <Home size={15} color={primaryColor} /> Mes biens
              </div>
              {properties.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#8b8d96' }}>
                  <Home size={32} style={{ opacity: 0.2, marginBottom: '0.5rem', display: 'block', margin: '0 auto 0.5rem' }} />
                  Aucun bien enregistré
                </div>
              ) : properties.map((p, i) => (
                <div key={i}
                  onClick={() => loadPropertyDetail(p)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1rem 1.25rem',
                    borderBottom: i < properties.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: '2px' }}>{p.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#8b8d96' }}>
                      {p.city} — {p.tenant_name ? `Locataire : ${p.tenant_name}` : 'Vacant'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 500, color: '#3ecf8e', fontSize: '0.9rem' }}>
                        {formatCurrency(p.total_revenue)}
                      </div>
                      <span style={{
                        fontSize: '0.72rem', color: STATUS_LABELS[p.status]?.color,
                        background: `${STATUS_LABELS[p.status]?.color}15`,
                        borderRadius: '20px', padding: '1px 8px',
                      }}>
                        {STATUS_LABELS[p.status]?.label}
                      </span>
                    </div>
                    <ChevronRight size={14} color="#555761" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Mes biens ── */}
        {activeTab === 'properties' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {properties.map((p, i) => (
                <div key={i}
                  onClick={() => loadPropertyDetail(p)}
                  style={{
                    background: '#161920', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '12px', padding: '1.25rem',
                    cursor: 'pointer', transition: 'all 0.2s',
                    position: 'relative', overflow: 'hidden',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.border = `1px solid ${primaryColor}40`
                    e.currentTarget.style.background = '#1a1f28'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.border = '1px solid rgba(255,255,255,0.07)'
                    e.currentTarget.style.background = '#161920'
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    height: '2px',
                    background: `linear-gradient(90deg, ${STATUS_LABELS[p.status]?.color}, transparent)`,
                  }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '8px',
                        background: `${STATUS_LABELS[p.status]?.color}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Home size={15} color={STATUS_LABELS[p.status]?.color} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, marginBottom: '2px' }}>{p.title}</div>
                        <div style={{ fontSize: '0.78rem', color: '#8b8d96' }}>{p.address}, {p.city}</div>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.72rem', color: STATUS_LABELS[p.status]?.color,
                      background: `${STATUS_LABELS[p.status]?.color}15`,
                      borderRadius: '20px', padding: '2px 8px', flexShrink: 0,
                    }}>
                      {STATUS_LABELS[p.status]?.label}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                    {[
                      { label: 'REVENUS',   value: formatCurrency(p.total_revenue),                       color: '#3ecf8e' },
                      { label: 'DÉPENSES',  value: formatCurrency(p.total_expenses),                      color: '#e5534b' },
                      { label: 'NET',       value: formatCurrency(p.total_revenue - p.total_expenses),    color: primaryColor },
                      { label: 'LOCATAIRE', value: p.tenant_name || 'Vacant',                             color: '#f0ece4' },
                    ].map((item, j) => (
                      <div key={j} style={{ background: '#1e2128', borderRadius: '6px', padding: '0.5rem' }}>
                        <div style={{ color: '#8b8d96', fontSize: '0.68rem', marginBottom: '2px' }}>{item.label}</div>
                        <div style={{ color: item.color, fontWeight: 500, fontSize: j === 3 ? '0.75rem' : '0.8rem' }}>
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#5b9cf6', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    Voir détail <ChevronRight size={12} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Détail bien ── */}
        {activeTab === 'property-detail' && selectedProperty && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <button
              onClick={() => setActiveTab('properties')}
              style={{
                background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px', padding: '6px 12px',
                color: '#8b8d96', fontSize: '0.8rem', cursor: 'pointer',
                marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              <ArrowLeft size={13} /> Retour aux biens
            </button>

            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: '1.2rem',
              marginBottom: '1.5rem', color: primaryColor,
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <Home size={18} /> {selectedProperty.title}
            </h2>

            {propLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <Spinner size="md" />
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                  {[
                    { label: 'Revenus totaux',   value: formatCurrency(selectedProperty.total_revenue),  color: '#3ecf8e',   icon: <TrendingUp   size={14} /> },
                    { label: 'Dépenses totales', value: formatCurrency(selectedProperty.total_expenses), color: '#e5534b',   icon: <TrendingDown size={14} /> },
                    { label: 'Revenu net',       value: formatCurrency(selectedProperty.total_revenue - selectedProperty.total_expenses), color: primaryColor, icon: <Wallet size={14} /> },
                  ].map((card, i) => (
                    <div key={i} style={{
                      background: '#161920', border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: '10px', padding: '1rem',
                      position: 'relative', overflow: 'hidden',
                    }}>
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0,
                        height: '2px', background: `linear-gradient(90deg, ${card.color}, transparent)`,
                      }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ fontSize: '0.68rem', color: '#8b8d96', textTransform: 'uppercase' }}>
                          {card.label}
                        </div>
                        <span style={{ color: card.color }}>{card.icon}</span>
                      </div>
                      <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', color: card.color, fontWeight: 600 }}>
                        {card.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Paiements */}
                <div style={{
                  background: '#161920', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem',
                }}>
                  <div style={{
                    padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
                    fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    <Wallet size={15} color="#3ecf8e" /> Historique des paiements
                  </div>
                  {propPayments.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#8b8d96', fontSize: '0.875rem' }}>
                      <Wallet size={28} style={{ opacity: 0.2, display: 'block', margin: '0 auto 0.5rem' }} />
                      Aucun paiement enregistré
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                      <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead>
                          <tr style={{ background: '#13171f', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            {['Locataire', 'Période', 'Montant dû', 'Montant payé', 'Statut'].map(h => (
                              <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.68rem', color: '#555761', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {propPayments.map((p, i) => (
                            <tr key={i}
                              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <td style={{ padding: '0.75rem 1rem' }}>{p.tenant_name || '—'}</td>
                              <td style={{ padding: '0.75rem 1rem', color: '#8b8d96' }}>
                                {MONTHS[(p.period_month || 1) - 1]} {p.period_year}
                              </td>
                              <td style={{ padding: '0.75rem 1rem', color: '#8b8d96' }}>
                                {formatCurrency(p.amount_due)}
                              </td>
                              <td style={{ padding: '0.75rem 1rem', color: '#3ecf8e', fontWeight: 500 }}>
                                {formatCurrency(p.amount_paid)}
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <span style={{
                                  fontSize: '0.72rem', fontWeight: 500,
                                  color:      PAY_STATUS[p.status]?.color,
                                  background: `${PAY_STATUS[p.status]?.color}15`,
                                  borderRadius: '20px', padding: '2px 8px',
                                }}>
                                  {PAY_STATUS[p.status]?.label}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Dépenses */}
                <div style={{
                  background: '#161920', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '12px', overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
                    fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    <Wrench size={15} color="#d4a853" /> Dépenses
                  </div>
                  {propExpenses.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#8b8d96', fontSize: '0.875rem' }}>
                      <Wrench size={28} style={{ opacity: 0.2, display: 'block', margin: '0 auto 0.5rem' }} />
                      Aucune dépense enregistrée
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                      <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead>
                          <tr style={{ background: '#13171f', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            {['Titre', 'Catégorie', 'Montant', 'Date'].map(h => (
                              <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.68rem', color: '#555761', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {propExpenses.map((e, i) => (
                            <tr key={i}
                              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                              onMouseEnter={ev => ev.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                              onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}
                            >
                              <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{e.title}</td>
                              <td style={{ padding: '0.75rem 1rem', color: '#8b8d96' }}>
                                {CATEGORY_LABELS[e.category] || e.category}
                              </td>
                              <td style={{ padding: '0.75rem 1rem', color: '#e5534b', fontWeight: 500 }}>
                                {formatCurrency(e.amount)}
                              </td>
                              <td style={{ padding: '0.75rem 1rem', color: '#8b8d96', fontSize: '0.75rem' }}>
                                {formatDate(e.expense_date)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Bilan financier ── */}
        {activeTab === 'finance' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{
              background: '#161920', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem',
            }}>
              <h3 style={{
                fontFamily: 'var(--font-display)', fontSize: '1.1rem',
                color: primaryColor, marginBottom: '1.5rem',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <BarChart2 size={18} /> Bilan global
              </h3>

              {(() => {
                const revenue  = summary?.total_revenue  || 0
                const expenses = summary?.total_expenses || 0
                const total    = revenue + expenses || 1
                const revPct   = Math.round((revenue  / total) * 100)
                const expPct   = Math.round((expenses / total) * 100)
                return (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8rem' }}>
                      <span style={{ color: '#3ecf8e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <TrendingUp size={12} /> Revenus {revPct}%
                      </span>
                      <span style={{ color: '#e5534b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <TrendingDown size={12} /> Dépenses {expPct}%
                      </span>
                    </div>
                    <div style={{ height: 10, borderRadius: 5, background: '#1e2128', overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${revPct}%`, background: '#3ecf8e', transition: 'width 1s ease' }} />
                      <div style={{ width: `${expPct}%`, background: '#e5534b', transition: 'width 1s ease' }} />
                    </div>
                  </div>
                )
              })()}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                {[
                  { label: 'Total revenus',  value: formatCurrency(summary?.total_revenue),  color: '#3ecf8e', icon: <TrendingUp   size={20} /> },
                  { label: 'Total dépenses', value: formatCurrency(summary?.total_expenses), color: '#e5534b', icon: <TrendingDown size={20} /> },
                  { label: 'Revenu net',     value: formatCurrency(summary?.net_income),     color: primaryColor, icon: <Wallet    size={20} /> },
                ].map((item, i) => (
                  <div key={i} style={{ background: '#1e2128', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
                    <div style={{ color: item.color, marginBottom: '6px' }}>{item.icon}</div>
                    <div style={{ fontSize: '0.68rem', color: '#8b8d96', textTransform: 'uppercase', marginBottom: '4px' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: item.color }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bilan par bien */}
            <div style={{
              background: '#161920', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '12px', overflow: 'hidden',
            }}>
              <div style={{
                padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
                fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <Home size={15} color={primaryColor} /> Bilan par bien
              </div>
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: '#13171f', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {['Bien', 'Revenus', 'Dépenses', 'Net', 'Statut'].map(h => (
                        <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.68rem', color: '#555761', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((p, i) => {
                      const net = (p.total_revenue || 0) - (p.total_expenses || 0)
                      return (
                        <tr key={i}
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                          onClick={() => loadPropertyDetail(p)}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '0.85rem 1rem', fontWeight: 500 }}>
                            {p.title}
                            <div style={{ fontSize: '0.72rem', color: '#8b8d96' }}>{p.city}</div>
                          </td>
                          <td style={{ padding: '0.85rem 1rem', color: '#3ecf8e' }}>{formatCurrency(p.total_revenue)}</td>
                          <td style={{ padding: '0.85rem 1rem', color: '#e5534b' }}>{formatCurrency(p.total_expenses)}</td>
                          <td style={{ padding: '0.85rem 1rem', color: net >= 0 ? primaryColor : '#e5534b', fontWeight: 500 }}>
                            {formatCurrency(net)}
                          </td>
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <span style={{
                              fontSize: '0.72rem', color: STATUS_LABELS[p.status]?.color,
                              background: `${STATUS_LABELS[p.status]?.color}15`,
                              borderRadius: '20px', padding: '2px 8px',
                            }}>
                              {STATUS_LABELS[p.status]?.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
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
                  {owner?.first_name?.[0]}{owner?.last_name?.[0]}
                </div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>
                    {owner?.first_name} {owner?.last_name}
                  </div>
                  <div style={{ color: '#8b8d96', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Mail size={13} /> {owner?.email}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[
                  { label: 'Téléphone',         value: owner?.phone },
                  { label: 'Adresse',           value: owner?.address },
                  { label: 'N° CNI',            value: owner?.id_card_number },
                  { label: 'Dernière connexion', value: formatDate(owner?.last_portal_login) },
                ].map((item, i) => (
                  <div key={i} style={{ background: '#1e2128', borderRadius: '8px', padding: '0.75rem' }}>
                    <div style={{ color: '#8b8d96', fontSize: '0.72rem', marginBottom: '4px', textTransform: 'uppercase' }}>
                      {item.label}
                    </div>
                    <div style={{ color: '#f0ece4', fontWeight: 500, fontSize: '0.875rem' }}>
                      {item.value || '—'}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: '1.5rem', padding: '1rem',
                background: `${primaryColor}08`, border: `1px solid ${primaryColor}20`,
                borderRadius: '10px',
              }}>
                <div style={{
                  fontSize: '0.8rem', fontWeight: 500, color: primaryColor,
                  marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <Building2 size={14} /> Votre agence
                </div>
                <div style={{ fontSize: '0.875rem', color: '#8b8d96', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>{agency?.name}</span>
                  {agency?.email && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Mail size={12} /> {agency.email}
                    </span>
                  )}
                  {agency?.phone && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Phone size={12} /> {agency.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}