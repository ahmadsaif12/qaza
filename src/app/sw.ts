/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

type PushPayload = {
  title?: string;
  body?: string;
  payload?: {
    url?: string;
    type?: string;
    prayerName?: string;
    date?: string;
    tokens?: {
      completed?: string;
      missed?: string;
    };
  };
};

type NotificationActionOption = {
  action: string;
  title: string;
};

type ActionableNotificationOptions = NotificationOptions & {
  actions?: NotificationActionOption[];
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

self.addEventListener('push', (event) => {
  const data = (event.data?.json() ?? {}) as PushPayload;
  const title = data.title || "Prayer Reminder";
  const payload = data.payload ?? {};
  const options: ActionableNotificationOptions = {
    body: data.body,
    icon: "/icon-192x192.png",
    data: payload,
  };

  if (payload.type === "prayer_checkin" && payload.prayerName && payload.date) {
    options.actions = [
      { action: "completed", title: "Yes, I prayed" },
      { action: "missed", title: "No, log to Qaza" }
    ];
  }
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === "test_completed" || event.action === "test_missed") {
    // Just close the notification. In a real SW we could postMessage to the client to show a toast,
    // but the user just wants to see what the buttons look like without backend calls.
    return;
  }

  if (event.action === "completed" || event.action === "missed") {
    const payload = event.notification.data as PushPayload["payload"];
    const endpoint = event.action === "completed" 
      ? '/api/notifications/prayer-checkin/prayed'
      : '/api/notifications/prayer-checkin/qaza';
    const actionToken = event.action === "completed"
      ? payload?.tokens?.completed
      : payload?.tokens?.missed;
      
    event.waitUntil(
      fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prayerName: payload?.prayerName,
          date: payload?.date,
          actionToken,
        })
      })
    );
  } else {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return self.clients.openWindow(event.notification.data?.url || '/');
      })
    );
  }
});
