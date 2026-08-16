import { useEffect, useCallback } from 'react'

export function useNotification() {
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  }, [])

  const sendNotification = useCallback((title: string, options: NotificationOptions = {}) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23f97316"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>',
        ...options,
      })
    }
  }, [])

  useEffect(() => {
    requestPermission()
  }, [requestPermission])

  return { sendNotification, requestPermission }
}
