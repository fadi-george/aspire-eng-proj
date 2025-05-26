declare const self: ServiceWorkerGlobalScope;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

interface PushNotificationData {
  title: string;
  body: string;
  data: {
    url: string;
  };
}
// Handle push notifications (for future use)
self.addEventListener("push", (event) => {
  if (event.data) {
    const data: PushNotificationData = event.data.json();
    const { url } = data.data;

    const options = {
      body: data.body,
      icon: "/favicon.ico",
      badge: "/badge-72x72.png",
      data: {
        url: `${self.location.origin}${url}`,
      },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data.url));
});
