'use client'

import { useState, useCallback } from 'react'
import api from '@/lib/api'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default'
  )
  const [subscribed, setSubscribed] = useState(false)

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'denied' as const
    const result = await Notification.requestPermission()
    setPermission(result)
    return result
  }, [])

  const subscribe = useCallback(async () => {
    const perm = await requestPermission()
    if (perm !== 'granted') return

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) return

    const registration = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
    })

    const json = subscription.toJSON()
    await api.post('/notifications/subscribe', {
      endpoint: json.endpoint,
      keys: {
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
      },
    })

    setSubscribed(true)
  }, [requestPermission])

  const unsubscribe = useCallback(async () => {
    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration) return

    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) return

    await api.delete('/notifications/unsubscribe', {
      data: { endpoint: subscription.endpoint },
    })

    await subscription.unsubscribe()
    setSubscribed(false)
  }, [])

  return { permission, subscribed, requestPermission, subscribe, unsubscribe }
}
