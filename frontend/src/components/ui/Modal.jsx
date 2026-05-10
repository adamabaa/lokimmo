import { useEffect } from 'react'

export default function Modal({ isOpen, onClose, title, children, footer }) {
  // Fermer avec Échap
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="lk-modal-overlay" onClick={onClose}>
      <div className="lk-modal" onClick={e => e.stopPropagation()}>
        <div className="lk-modal-header">
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize:   '1.1rem',
            fontWeight: 500,
          }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'var(--lk-dark-4)',
              border:     '1px solid var(--lk-border-2)',
              borderRadius: '50%',
              width: 32, height: 32,
              display:    'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor:     'pointer',
              color:      'var(--lk-text-secondary)',
              fontSize:   '1rem',
              transition: 'all 0.2s',
            }}
          >
            ✕
          </button>
        </div>
        <div className="lk-modal-body">{children}</div>
        {footer && <div className="lk-modal-footer">{footer}</div>}
      </div>
    </div>
  )
}