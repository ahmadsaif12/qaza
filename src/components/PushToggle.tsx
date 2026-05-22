"use client"

import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushToggle() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setIsSubscribed(!!sub)
        })
      })
    }
  }, [])

  const handleToggle = async (checked: boolean) => {
    try {
      if (!checked) {
        // Unsubscribe
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        if (sub) await sub.unsubscribe()
        setIsSubscribed(false)
        toast.success("Notifications disabled")
        return
      }

      // Subscribe
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        toast.error("Permission denied")
        setIsSubscribed(false)
        return
      }

      let lat = null;
      let lng = null;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch (err) {
        console.warn("Geolocation failed", err);
        toast.warning("Location not provided. Accurate times might not work.");
      }

      const reg = await navigator.serviceWorker.ready
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        toast.error("Push notifications are not configured yet.")
        return
      }

      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey)
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      })

      // Send to server
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: sub,
          location: { lat, lng, timezone }
        })
      })

      if (!res.ok) throw new Error("Failed to save subscription")

      setIsSubscribed(true)
      toast.success("Notifications enabled! We'll remind you to log prayers.")
    } catch (e) {
      console.error(e)
      setIsSubscribed(false)
      toast.error("Failed to configure push notifications")
    }
  }

  if (!isSupported) {
    return <div className="text-sm text-muted-foreground">Push notifications not supported on this device.</div>
  }

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <label className="text-base font-medium">Daily Reminders</label>
        <p className="text-sm text-muted-foreground">Receive reminders to log your prayers.</p>
      </div>
      <Switch checked={isSubscribed} onCheckedChange={handleToggle} />
    </div>
  )
}
