import { useState }           from 'react'
import { onlinePaymentApi }   from '../../api/onlinePaymentApi'
import { useToast }            from '../../context/ToastContext'
import Spinner                 from './Spinner'

export default function OnlinePaymentButton({ paymentId, disabled = false }) {
  const { show }      = useToast()
  const [loading, setLoading] = useState(false)

  const handlePay = async () => {
    setLoading(true)
    try {
      const res = await onlinePaymentApi.initiate({ payment_id: paymentId })
      const { payment_url } = res.data.data

      if (payment_url) {
        window.open(payment_url, '_blank', 'width=900,height=700')
        show('Page de paiement ouverte — Wave, Orange Money disponibles', 'info')
      } else {
        show('Erreur : URL de paiement non disponible', 'error')
      }
    } catch (err) {
      show(err.response?.data?.message || 'Erreur initialisation paiement', 'error')
    } finally { setLoading(false) }
  }

  return (
    <button
      onClick={handlePay}
      disabled={loading || disabled}
      style={{
        padding:     '0.35rem 0.75rem',
        background:  'linear-gradient(135deg, #1a73e8, #0d47a1)',
        border:      'none',
        borderRadius:'8px',
        color:       '#fff',
        fontSize:    '0.78rem',
        fontWeight:  500,
        cursor:      loading || disabled ? 'not-allowed' : 'pointer',
        display:     'flex',
        alignItems:  'center',
        gap:         '5px',
        opacity:     disabled ? 0.5 : 1,
        transition:  'all 0.2s',
        boxShadow:   '0 2px 6px rgba(26,115,232,0.3)',
        whiteSpace:  'nowrap',
      }}
      onMouseEnter={e => {
        if (!loading && !disabled) e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {loading ? <Spinner size="sm" /> : <span>📱</span>}
      Payer en ligne
    </button>
  )
}