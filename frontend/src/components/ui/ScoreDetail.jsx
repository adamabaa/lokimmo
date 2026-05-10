import { useState, useEffect } from 'react'
import { CreditCard, DollarSign, Clock, Calendar, User } from 'lucide-react'
import { scoreApi }            from '../../api/scoreApi'
import ScoreBadge              from './ScoreBadge'
import Modal                   from './Modal'
import Spinner                 from './Spinner'

const CRITERIA = [
  { key: 'payment_history', label: 'Historique paiements', max: 40, icon: <CreditCard size={18} />,
    desc: 'Basé sur le % de paiements réglés' },
  { key: 'income_ratio',    label: 'Ratio revenu / loyer', max: 25, icon: <DollarSign size={18} />,
    desc: 'Idéalement le revenu est ≥ 3x le loyer' },
  { key: 'punctuality',     label: 'Ponctualité',          max: 20, icon: <Clock size={18} />,
    desc: 'Paiements effectués avant échéance' },
  { key: 'seniority',       label: 'Ancienneté',           max: 10, icon: <Calendar size={18} />,
    desc: 'Durée du contrat actif' },
  { key: 'profile',         label: 'Complétude du profil', max: 5,  icon: <User size={18} />,
    desc: 'Informations du profil renseignées' },
]

export default function ScoreDetail({ isOpen, onClose, tenantId, tenantName, onRecalculate }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [recalc,  setRecalc]  = useState(false)

  useEffect(() => {
    if (isOpen && tenantId) {
      setLoading(true)
      scoreApi.detail(tenantId)
        .then(res => setData(res.data.data))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [isOpen, tenantId])

  const handleRecalculate = async () => {
    setRecalc(true)
    try {
      await scoreApi.calculate(tenantId)
      const res = await scoreApi.detail(tenantId)
      setData(res.data.data)
      if (onRecalculate) onRecalculate()
    } finally { setRecalc(false) }
  }

  const total = data
    ? data.detail.payment_history + data.detail.income_ratio +
      data.detail.punctuality     + data.detail.seniority    +
      data.detail.profile
    : 0

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Score locatif — ${tenantName}`}
      footer={
        <>
          <button className="lk-btn lk-btn-secondary" onClick={onClose}>
            Fermer
          </button>
          <button className="lk-btn lk-btn-primary" onClick={handleRecalculate} disabled={recalc}>
            {recalc ? <Spinner size="sm" /> : '🔄 Recalculer'}
          </button>
        </>
      }
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Spinner size="md" />
        </div>
      ) : data ? (
        <div>
          {/* Score total */}
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            '1.5rem',
            padding:        '1.5rem',
            background:     'var(--lk-dark-3)',
            borderRadius:   'var(--radius-lg)',
            marginBottom:   '1.5rem',
          }}>
            <ScoreBadge score={total} size="lg" />
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                {total}<span style={{ fontSize: '1rem', color: 'var(--lk-text-muted)', fontWeight: 400 }}>/100</span>
              </div>
              <div style={{ color: 'var(--lk-text-secondary)', fontSize: '0.875rem' }}>
                Score locatif global
              </div>
            </div>
          </div>

          {/* Détail par critère */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {CRITERIA.map(criterion => {
              const value   = data.detail[criterion.key] || 0
              const percent = Math.round((value / criterion.max) * 100)
              const color   = percent >= 75 ? '#3ecf8e'
                : percent >= 50 ? '#5b9cf6'
                : percent >= 25 ? '#d4a853'
                : '#e5534b'

              return (
                <div key={criterion.key} style={{
                  background:   'var(--lk-dark-3)',
                  borderRadius: 'var(--radius-md)',
                  padding:      '0.875rem 1rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1rem' }}>{criterion.icon}</span>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{criterion.label}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--lk-text-muted)' }}>{criterion.desc}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
                      <span style={{ fontWeight: 700, color, fontSize: '0.9rem' }}>{value}</span>
                      <span style={{ color: 'var(--lk-text-muted)', fontSize: '0.8rem' }}>/{criterion.max}</span>
                    </div>
                  </div>

                  {/* Barre de progression */}
                  <div style={{ height: 6, background: 'var(--lk-dark-4)', borderRadius: 3 }}>
                    <div style={{
                      height:     6,
                      borderRadius: 3,
                      width:      `${percent}%`,
                      background: `linear-gradient(90deg, ${color}cc, ${color})`,
                      transition: 'width 0.8s ease',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--lk-text-muted)', padding: '2rem' }}>
          Impossible de charger le score
        </div>
      )}
    </Modal>
  )
}