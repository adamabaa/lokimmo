import { useState, useCallback } from 'react'
import { ToastContext }           from './ToastContext'

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const show = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const icons = { success: '✓', error: '✕', info: 'ℹ' }

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="lk-toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`lk-toast lk-toast-${t.type}`}>
            <span style={{ fontWeight: 600 }}>{icons[t.type]}</span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}