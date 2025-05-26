export const registerServiceWorker = () => {
  // check if service worker is supported
  if (!("serviceWorker" in navigator)) {
    return;
  }
  if (!("PushManager" in window)) {
    return;
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/sw.js", {
        scope: "/",
        type: "module",
      })
      .then(() => {
        console.log("Service Worker registered");
      })
      .catch((error) => {
        console.error("Service Worker registration failed", error);
      });
  }
};
