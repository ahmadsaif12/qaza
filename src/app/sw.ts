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

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || "Prayer Reminder";
  
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body,
      icon: "/icon-192x192.png",
      data: data.payload,
      actions: [
        { action: "completed", title: "Yes, I prayed" },
        { action: "missed", title: "No, log to Qaza" }
      ]
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === "completed" || event.action === "missed") {
    const payload = event.notification.data;
    event.waitUntil(
      fetch('/api/push/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prayerName: payload.prayerName,
          status: event.action,
          date: payload.date
        })
      })
    );
  } else {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return self.clients.openWindow('/');
      })
    );
  }
});
