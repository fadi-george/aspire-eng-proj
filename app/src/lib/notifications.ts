import type { UserPushSubscription } from "@/shared/types/subscription";
import { useEffect } from "react";
import { toast } from "sonner";
import { apiClient } from "./api";
import { useAuth } from "./auth";

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

export const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const subscribeUserToPush =
  async (): Promise<UserPushSubscription | null> => {
    try {
      // register service worker
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        type: "module",
      });

      // subscribe to push
      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          import.meta.env.VITE_VAPID_PUBLIC_KEY,
        ),
      };
      const pushSubscription =
        await registration.pushManager.subscribe(subscribeOptions);

      // save to db
      console.log({
        j1: pushSubscription.toJSON(),
        j2: JSON.stringify(pushSubscription),
      });
      const response = await apiClient.post("/api/notifications/subscribe", {
        subscription: pushSubscription.toJSON(),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error("Service Worker registration failed", error);
    }
    return null;
  };

export const usePromptForNotifications = () => {
  const { setUser } = useAuth();

  useEffect(() => {
    const askedForNotifications = sessionStorage.getItem(
      "askedForNotifications",
    );
    const browserSupported = "Notification" in window;

    // update user subscriptions on new push subscription
    const updateUserSubscriptions = () => {
      return subscribeUserToPush().then((data) => {
        if (data) {
          setUser((user) => {
            const hasSubscription = user?.pushSubscriptions.some(
              (subscription) => subscription.endpoint === data.endpoint,
            );
            if (hasSubscription || !user) return user;
            return {
              ...user,
              pushSubscriptions: [...(user?.pushSubscriptions || []), data],
            };
          });
        }
      });
    };

    // if permission is not granted, prompt for notifications
    if (
      !askedForNotifications &&
      browserSupported &&
      !Notification.permission
    ) {
      toast.info("Get notified of new releases?", {
        closeButton: true,
        action: {
          label: "Enable",
          onClick: () => {
            Notification.requestPermission().then((result) => {
              if (result === "granted") {
                subscribeUserToPush();
              }
            });
          },
        },
        classNames: {
          actionButton: "!bg-blue-500 !text-white !border-blue-500",
        },
        duration: Infinity,
        onDismiss: () => {
          sessionStorage.setItem("askedForNotifications", "true");
        },
      });
    }

    // if permission was revoked
    if (!askedForNotifications && Notification.permission === "denied") {
      console.log(
        "Notifications were disabled. Reset your permissions to allow notifications.",
      );
    }

    // if permission was granted
    if (Notification.permission === "granted") {
      updateUserSubscriptions();
    }
  }, []);
};
