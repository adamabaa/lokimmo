import { useState, useRef, useEffect } from 'react'
import { Bell, Check, CheckCheck, AlertCircle, FileText } from 'lucide-react'
import { useNotifications } from '../../context/NotificationContext'

const TYPE_ICONS = {
  payment_late:      <AlertCircle size={14} color="#e5534b" />,
  contract_expiring: <FileText    size={14} color="#d4a853" />,
  default:           <Bell        size={14} color="#5b9cf6" />,
}

const TYPE_COLORS = {
  payment_late:      '#e5534b',
  contract_expiring: '#d4a853',
  default:           '#5b9cf6',
}

export default function NotificationBell() {
  const { count, notifications, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const dropdownRef     = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unread = notifications.filter(n => !n.is_read)
  const read   = notifications.filter(n => n.is_read)

  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const diff  = Date.now() - new Date(dateStr).getTime()
    const mins  = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days  = Math.floor(diff / 86400000)
    if (mins  < 60)  return `il y a ${mins} min`
    if (hours < 24)  return `il y a ${hours}h`
    return `il y a ${days}j`
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position:       'relative',
          width:          36, height: 36,
          borderRadius:   '50%',
          background:     open ? 'var(--lk-dark-3)' : 'transparent',
          border:         '1px solid var(--lk-border-2)',
          display:        'flex', alignItems: 'center', justifyContent: 'center',
          cursor:         'pointer',
          transition:     'all 0.2s',
          color:          'var(--lk-text-secondary)',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--lk-dark-3)'}
        onMouseLeave={e => e.currentTarget.style.background = open ? 'var(--lk-dark-3)' : 'transparent'}
      >
        <Bell size={17} />
        {count > 0 && (
          <div style={{
            position:       'absolute', top: -2, right: -2,
            minWidth:       18, height: 18,
            borderRadius:   '9px',
            background:     'var(--lk-danger)',
            color:          '#fff',
            fontSize:       '0.65rem', fontWeight: 700,
            display:        'flex', alignItems: 'center', justifyContent: 'center',
            padding:        '0 4px',
            border:         '2px solid var(--lk-dark)',
            animation:      'pulse 2s infinite',
          }}>
            {count > 99 ? '99+' : count}
          </div>
        )}
      </button>

      {open && (
        <div className="lk-notification-dropdown" style={{
          position:     'absolute', top: '44px', right: 0,
          width:        '360px', maxHeight: '480px',
          background:   'var(--lk-dark-2)',
          border:       '1px solid var(--lk-border-2)',
          borderRadius: 'var(--radius-lg)',
          boxShadow:    'var(--shadow-lg)',
          zIndex:       1000, overflow: 'hidden',
          animation:    'fadeInScale 0.2s ease',
        }}>
          {/* Header */}
          <div style={{
            display:        'flex', alignItems: 'center',
            justifyContent: 'space-between',
            padding:        '1rem 1.25rem',
            borderBottom:   '1px solid var(--lk-border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={15} color="var(--lk-text-secondary)" />
              <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>Notifications</span>
              {count > 0 && (
                <span style={{
                  background:   'var(--lk-danger-bg)', color: 'var(--lk-danger)',
                  borderRadius: '10px', padding: '1px 8px',
                  fontSize:     '0.75rem', fontWeight: 500,
                }}>
                  {count} non lues
                </span>
              )}
            </div>
            {count > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--lk-amber)', fontSize: '0.75rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                }}
              >
                <CheckCheck size={13} /> Tout lire
              </button>
            )}
          </div>

          {/* Liste */}
          <div style={{ overflowY: 'auto', maxHeight: '380px' }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '3rem 1rem', textAlign: 'center',
                color: 'var(--lk-text-muted)', fontSize: '0.875rem',
              }}>
                <Bell size={32} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
                <div>Aucune notification</div>
              </div>
            ) : (
              <>
                {unread.length > 0 && (
                  <>
                    <div style={{
                      padding: '0.5rem 1.25rem 0.25rem',
                      fontSize: '0.68rem', color: 'var(--lk-text-muted)',
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                    }}>Non lues</div>
                    {unread.map(n => (
                      <NotificationItem key={n.id} notification={n}
                        onRead={() => markRead(n.id)} formatTime={formatTime} />
                    ))}
                  </>
                )}
                {read.length > 0 && (
                  <>
                    <div style={{
                      padding: '0.5rem 1.25rem 0.25rem',
                      fontSize: '0.68rem', color: 'var(--lk-text-muted)',
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      borderTop: unread.length > 0 ? '1px solid var(--lk-border)' : 'none',
                      marginTop: unread.length > 0 ? '4px' : 0,
                    }}>Lues</div>
                    {read.map(n => (
                      <NotificationItem key={n.id} notification={n}
                        onRead={() => {}} formatTime={formatTime} />
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationItem({ notification: n, onRead, formatTime }) {
  const icon  = TYPE_ICONS[n.type]  || TYPE_ICONS.default
  const color = TYPE_COLORS[n.type] || TYPE_COLORS.default

  return (
    <div
      onClick={() => !n.is_read && onRead()}
      style={{
        display:    'flex', gap: '10px',
        padding:    '0.85rem 1.25rem',
        background: n.is_read ? 'transparent' : 'rgba(212,168,83,0.04)',
        borderLeft: n.is_read ? 'none' : `2px solid ${color}`,
        cursor:     n.is_read ? 'default' : 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => { if (!n.is_read) e.currentTarget.style.background = 'rgba(212,168,83,0.08)' }}
      onMouseLeave={e => { if (!n.is_read) e.currentTarget.style.background = 'rgba(212,168,83,0.04)' }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background:     `${color}15`,
        display:        'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink:     0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize:     '0.85rem',
          fontWeight:   n.is_read ? 400 : 500,
          color:        n.is_read ? 'var(--lk-text-secondary)' : 'var(--lk-text-primary)',
          marginBottom: '2px',
          whiteSpace:   'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {n.title}
        </div>
        <div style={{
          fontSize:     '0.78rem', color: 'var(--lk-text-muted)',
          whiteSpace:   'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {n.body}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--lk-text-muted)', marginTop: '3px' }}>
          {formatTime(n.created_at)}
        </div>
      </div>
      {!n.is_read && (
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: color, flexShrink: 0, marginTop: '4px',
        }} />
      )}
    </div>
  )
}