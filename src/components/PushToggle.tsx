"use client"

import { useEffect, useState } from "react"
import { BellRing } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useMounted } from "@/hooks/useMounted"
import { useAppStore } from "@/store"
import {
  type ActionableNotificationOptions,
  detectBrowserLocation,
  getCurrentPushSubscription,
  isPushSupported,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from "@/lib/browser-permissions"

export function PushToggle() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const setUserLocation = useAppStore((state) => state.setUserLocation)
  const mounted = useMounted()
  const isSupported = mounted && isPushSupported()

  useEffect(() => {
    if (!isSupported) return

    let isActive = true
    getCurrentPushSubscription().then((subscription) => {
      if (isActive) {
        setIsSubscribed(!!subscription)
      }
    })

    return () => {
      isActive = false
    }
  }, [isSupported])

  const handleToggle = async (checked: boolean) => {
    try {
      if (!checked) {
        await unsubscribeFromPushNotifications()
        setIsSubscribed(false)
        toast.success("Notifications disabled")
        return
      }

      let location

      try {
        location = await detectBrowserLocation()
        setUserLocation({ lat: location.lat, lng: location.lng })
      } catch (error) {
        console.warn("Geolocation failed", error)
        toast.warning("Location not provided. Accurate times might not work.")
      }

      await subscribeToPushNotifications(location)

      setIsSubscribed(true)
      toast.success("Notifications enabled! We'll remind you to log prayers.")
    } catch (error) {
      console.error(error)
      setIsSubscribed(false)
      toast.error("Failed to configure push notifications")
    }
  }

  if (!mounted) {
    return <div className="h-6 w-11 bg-muted rounded-full animate-pulse" />
  }

  if (!isSupported) {
    return <div className="text-sm text-muted-foreground">Push notifications not supported on this device.</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <label className="text-base font-medium">Daily Reminders</label>
          <p className="text-sm text-muted-foreground">Receive reminders to log your prayers.</p>
        </div>
        <Switch checked={isSubscribed} onCheckedChange={handleToggle} />
      </div>

      {isSubscribed && (
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={async () => {
              const registration = await navigator.serviceWorker.ready
              const notificationOptions: ActionableNotificationOptions = {
                body: "Quick check-in: mark it prayed if you completed it, or add it to Qaza if you missed it.",
                icon: "/icon-192x192.png",
                data: {
                  url: "/?checkin=fajr&date=test",
                  prayerName: "fajr",
                  date: "test",
                  type: "prayer_checkin",
                },
                actions: [
                  { action: "test_completed", title: "Yes, I prayed" },
                  { action: "test_missed", title: "No, add to Qaza" },
                ],
              }

              registration.showNotification("Did you pray Fajr?", notificationOptions)
            }}
          >
            <BellRing className="w-4 h-4 mr-2" />
            Test Notification
          </Button>
        </div>
      )}
    </div>
  )
}
