import { useNavigate }                from 'react-router-dom'
import { Lock, CreditCard, ArrowRight } from 'lucide-react'

export default function PlanLimitModal({ isOpen, onClose, message }) {
  const navigate = useNavigate()
  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        background:   'var(--lk-dark-2)',
        border:       '1px solid rgba(212,168,83,0.3)',
        borderRadius: 'var(--radius-lg)',
        padding:      '2rem',
        maxWidth:     '440px', width: '90%',
        textAlign:    'center',
        animation:    'fadeInScale 0.3s ease',
        position:     'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, var(--lk-amber), transparent)',
        }} />

        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          background: 'var(--lk-amber-bg)',
          border: '1px solid rgba(212,168,83,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1rem',
        }}>
          <Lock size={24} color="var(--lk-amber)" />
        </div>

        <h3 style={{
          fontFamily:   'var(--font-display)',
          fontSize:     '1.2rem',
          color:        'var(--lk-amber)',
          marginBottom: '0.75rem',
        }}>
          Limite de plan atteinte
        </h3>

        <p style={{
          color:        'var(--lk-text-secondary)',
          fontSize:     '0.875rem',
          lineHeight:   1.6,
          marginBottom: '1.5rem',
        }}>
          {message || 'Vous avez atteint la limite de votre plan actuel.'}
        </p>

        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap:                 '8px',
          marginBottom:        '1.5rem',
        }}>
          {[
            { name: 'Free',    price: '0',      color: '#8b8d96', props: '3 biens' },
            { name: 'Starter', price: '15 000', color: '#5b9cf6', props: '20 biens' },
            { name: 'Pro',     price: '35 000', color: '#d4a853', props: '∞ biens' },
          ].map((plan, i) => (
            <div key={i} style={{
              background:   `${plan.color}10`,
              border:       `1px solid ${plan.color}30`,
              borderRadius: 'var(--radius-md)',
              padding:      '0.75rem 0.5rem',
            }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: plan.color, marginBottom: '4px' }}>
                {plan.name}
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--lk-text-primary)' }}>
                {plan.price} <span style={{ fontSize: '0.65rem', color: 'var(--lk-text-muted)' }}>FCFA/mois</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--lk-text-muted)', marginTop: '2px' }}>
                {plan.props}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button onClick={onClose} className="lk-btn lk-btn-secondary" style={{ fontSize: '0.875rem' }}>
            Annuler
          </button>
          <button
            onClick={() => { onClose(); navigate('/billing') }}
            className="lk-btn lk-btn-primary"
            style={{ fontSize: '0.875rem', gap: '6px', display: 'flex', alignItems: 'center' }}
          >
            <CreditCard size={14} /> Voir les plans <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}