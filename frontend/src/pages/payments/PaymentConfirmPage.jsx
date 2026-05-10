import { useEffect, useState }          from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { onlinePaymentApi }             from '../../api/onlinePaymentApi'
import { formatCurrency }               from '../../utils/formatCurrency'
import Spinner                          from '../../components/ui/Spinner'
import {
  CheckCircle, Clock, XCircle,
  RefreshCw, ArrowLeft, Mail,
} from 'lucide-react'

export default function PaymentConfirmPage() {
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()
  const transactionId  = searchParams.get('transaction_id')

  const [status,  setStatus]  = useState(!transactionId ? 'error' : 'loading')
  const [payment, setPayment] = useState(null)

  useEffect(() => {
    if (!transactionId) return
    let isMounted = true

    onlinePaymentApi.verify({ transaction_id: transactionId })
      .then(res => {
        if (!isMounted) return
        const data = res.data.data
        setPayment(data)
        setStatus(data.is_paid ? 'success' : 'pending')
      })
      .catch(() => { if (isMounted) setStatus('error') })

    return () => { isMounted = false }
  }, [transactionId])

  const STATES = {
    success: {
      icon:    <CheckCircle size={56} color="#3ecf8e" />,
      title:   'Paiement confirmé !',
      color:   '#3ecf8e',
      message: (
        <>
          Votre paiement de{' '}
          <strong style={{ color: '#f0ece4' }}>
            {formatCurrency(payment?.amount)}
          </strong>{' '}
          a été reçu avec succès.
        </>
      ),
      sub: (
        <p style={{ color: '#8b8d96', fontSize: '0.875rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Mail size={14} /> Une confirmation a été envoyée par email.
        </p>
      ),
      btn: {
        label: <><ArrowLeft size={14} /> Voir mes paiements</>,
        action: () => navigate('/payments'),
        bg: '#3ecf8e', color: '#0f1117',
      },
    },
    pending: {
      icon:    <Clock size={56} color="#d4a853" />,
      title:   'Paiement en attente',
      color:   '#d4a853',
      message: 'Le paiement est en cours de traitement. Actualisez dans quelques instants.',
      sub:     null,
      btn: {
        label: <><RefreshCw size={14} /> Actualiser</>,
        action: () => window.location.reload(),
        bg: '#d4a853', color: '#0f1117',
      },
    },
    error: {
      icon:    <XCircle size={56} color="#e5534b" />,
      title:   'Paiement échoué',
      color:   '#e5534b',
      message: 'Le paiement n\'a pas pu être confirmé. Réessayez ou contactez votre agence.',
      sub:     null,
      btn: {
        label: <><ArrowLeft size={14} /> Retour aux paiements</>,
        action: () => navigate('/payments'),
        bg: '#e5534b', color: '#fff',
      },
    },
  }

  const state = STATES[status]

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0c10',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', position: 'relative', overflow: 'hidden',
    }}>
      {/* Fond */}
      <div style={{
        position: 'fixed', top: '10%', left: '50%',
        transform: 'translateX(-50%)',
        width: '500px', height: '400px',
        background: `radial-gradient(ellipse, ${state?.color || '#d4a853'}08 0%, transparent 70%)`,
        pointerEvents: 'none', transition: 'background 0.5s',
      }} />

      <div style={{
        background:   '#161920',
        border:       `1px solid ${state?.color || 'rgba(255,255,255,0.07)'}20`,
        borderRadius: '20px',
        padding:      '3rem 2rem',
        maxWidth:     '440px', width: '100%',
        textAlign:    'center',
        animation:    'fadeInScale 0.4s ease',
        position:     'relative', overflow: 'hidden',
        boxShadow:    `0 24px 64px rgba(0,0,0,0.5)`,
      }}>
        {/* Accent top */}
        {state && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: '2px',
            background: `linear-gradient(90deg, ${state.color}, transparent)`,
          }} />
        )}

        {/* Loading */}
        {status === 'loading' && (
          <>
            <Spinner size="lg" />
            <p style={{ color: '#8b8d96', marginTop: '1.5rem', fontSize: '0.9rem' }}>
              Vérification du paiement...
            </p>
          </>
        )}

        {/* States */}
        {state && status !== 'loading' && (
          <>
            <div style={{ marginBottom: '1.25rem' }}>
              {state.icon}
            </div>

            <h2 style={{
              color:         state.color,
              marginBottom:  '0.75rem',
              fontFamily:    'var(--font-display)',
              fontSize:      '1.4rem',
              fontWeight:    600,
            }}>
              {state.title}
            </h2>

            <p style={{
              color:         '#8b8d96',
              marginBottom:  '1rem',
              fontSize:      '0.9rem',
              lineHeight:    1.6,
            }}>
              {state.message}
            </p>

            {state.sub}

            <button
              onClick={state.btn.action}
              style={{
                background:   state.btn.bg,
                color:        state.btn.color,
                border:       'none',
                borderRadius: '10px',
                padding:      '0.75rem 2rem',
                fontSize:     '0.875rem',
                fontWeight:   600,
                cursor:       'pointer',
                display:      'inline-flex',
                alignItems:   'center',
                gap:          '8px',
                transition:   'all 0.2s',
                boxShadow:    `0 4px 16px ${state.btn.bg}30`,
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {state.btn.label}
            </button>
          </>
        )}
      </div>
    </div>
  )
}