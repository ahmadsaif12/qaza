"use client"

export type BrowserLocation = {
  lat: number
  lng: number
  timezone: string
}

export type ActionableNotificationOptions = NotificationOptions & {
  actions?: Array<{
    action: string
    title: string
  }>
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

export function isPushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
}

export function detectBrowserLocation() {
  if (!("geolocation" in navigator)) {
    throw new Error("Geolocation is not supported by your browser.")
  }

  return new Promise<BrowserLocation>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        })
      },
      reject,
      { timeout: 10000 }
    )
  })
}

export async function getCurrentPushSubscription() {
  if (!isPushSupported()) return null

  const registration = await navigator.serviceWorker.ready
  return registration.pushManager.getSubscription()
}

export async function unsubscribeFromPushNotifications() {
  const subscription = await getCurrentPushSubscription()
  if (subscription) await subscription.unsubscribe()
}

export async function subscribeToPushNotifications(location?: BrowserLocation) {
  if (!isPushSupported()) {
    throw new Error("Push notifications are not supported on this device.")
  }

  const permission = await Notification.requestPermission()
  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.")
  }

  const registration = await navigator.serviceWorker.ready
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidPublicKey) {
    throw new Error("Push notifications are not configured yet.")
  }

  const existingSubscription = await registration.pushManager.getSubscription()
  const subscription =
    existingSubscription ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    }))

  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subscription,
      ...(location ? { location } : {}),
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to save push subscription.")
  }

  return subscription
}
