import { createContext, useContext } from 'react'

export const NotificationContext = createContext({
  count:         0,
  notifications: [],
  refresh:       () => {},
  markRead:      () => {},
  markAllRead:   () => {},
})

export const useNotifications = () => useContext(NotificationContext)