console.log("Service Worker loaded");
declare let self: ServiceWorkerGlobalScope;

self.addEventListener("install", (event) => {
  console.log("Service Worker installing");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activating");
  event.waitUntil(self.clients.claim());
});

// Handle push notifications (for future use)
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/favicon.ico",
    });
  }
});
