/// <reference no-default-lib="true"/>
/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle push notifications (for future use)
self.addEventListener("push", (event) => {
  console.log("Push notification received", event, {
    href: self.location.href,
    origin: self.location.origin,
  });
  if (event.data) {
    const data = event.data.json();

    const options = {
      body: data.body,
      icon: data.icon || "/favicon.ico",
      badge: "/badge-72x72.png",
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1,
        url: `${self.location.origin}/${data.owner}/${data.name}`,
      },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked", event);
  event.notification.close();

  event.waitUntil(self.clients.openWindow(event.notification.data.url));
});
