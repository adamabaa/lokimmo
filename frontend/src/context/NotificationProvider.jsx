import { useState, useEffect, useCallback } from 'react'
import { NotificationContext }               from './NotificationContext'
import { notificationApi }                   from '../api/notificationApi'

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [count,         setCount]         = useState(0)

  const refresh = useCallback(async () => {
    const token = localStorage.getItem('lk_token')
    if (!token) return
    try {
      await notificationApi.generate()
      const [listRes, countRes] = await Promise.all([
        notificationApi.getAll(),
        notificationApi.getCount(),
      ])
      setNotifications(listRes.data.data   || [])
      setCount(countRes.data.data?.count   || 0)
    } catch { /* silencieux */ }
  }, [])

  const markRead = useCallback(async (id) => {
    try {
      await notificationApi.markRead(id)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: 1 } : n)
      )
      setCount(prev => Math.max(0, prev - 1))
    } catch { /* silencieux */ }
  }, [])

  const markAllRead = useCallback(async () => {
    try {
      await notificationApi.markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })))
      setCount(0)
    } catch { /* silencieux */ }
  }, [])

  // Charger au démarrage
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('lk_token')
      if (token) await refresh()
    }
    init()
  }, [refresh])

  // Rafraîchir toutes les 5 minutes
  useEffect(() => {
    const tick = async () => {
      const token = localStorage.getItem('lk_token')
      if (token) await refresh()
    }
    const interval = setInterval(tick, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [refresh])

  return (
    <NotificationContext.Provider value={{
      count, notifications, refresh, markRead, markAllRead,
    }}>
      {children}
    </NotificationContext.Provider>
  )
}