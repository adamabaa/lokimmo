import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'

export default function Alert({ type = 'info', message, onClose }) {
  if (!message) return null

  const styles = {
    success: { bg: 'var(--lk-success-bg)', color: 'var(--lk-success)', icon: <CheckCircle size={18} /> },
    error:   { bg: 'var(--lk-danger-bg)',  color: 'var(--lk-danger)',  icon: <XCircle size={18} /> },
    info:    { bg: 'var(--lk-info-bg)',    color: 'var(--lk-info)',    icon: <Info size={18} /> },
    warning: { bg: 'var(--lk-warning-bg)', color: 'var(--lk-warning)', icon: <AlertTriangle size={18} /> },
  }

  const s = styles[type]

  return (
    <div style={{
      display:      'flex',
      alignItems:   'center',
      gap:          '10px',
      background:   s.bg,
      color:        s.color,
      borderRadius: 'var(--radius-md)',
      padding:      '0.75rem 1rem',
      fontSize:     '0.875rem',
      marginBottom: '1rem',
      animation:    'fadeIn 0.3s ease',
    }}>
      <span style={{ fontWeight: 600, display: 'flex' }}>{s.icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none',
            color: s.color, cursor: 'pointer', opacity: 0.7,
            display: 'flex', alignItems: 'center'
          }}
        ><X size={16} /></button>
      )}
    </div>
  )
}