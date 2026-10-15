import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { api } from "../api/client";
import { firebaseConfigured, getMessagingIfSupported } from "../firebase";

const NotificationsContext = createContext(null);

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export function NotificationsProvider({ children }) {
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );
  const [toast, setToast] = useState(null);
  const messagingRef = useRef(null);
  const swRegistrationRef = useRef(null);

  const dlog = useCallback((...args) => {
    console.log("[notifications]", ...args);
  }, []);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  const registerToken = useCallback(async (messaging, registration) => {
    if (!VAPID_KEY) {
      dlog("ERREUR : VITE_FIREBASE_VAPID_KEY manquante");
      showToast("Cle VAPID manquante : impossible de recevoir des notifications.", "error");
      return;
    }
    dlog("registerToken() : demarrage");
    try {
      const token = await Promise.race([
        getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Delai depasse (20s)")), 20000)),
      ]);
      dlog("getToken() a renvoye :", token ? token.slice(0, 20) + "..." : token);
      if (token) {
        const saved = await api.post("/device-tokens/", { token, plateforme: "web" });
        dlog("token enregistre cote backend, id =", saved?.id);
        showToast("Notifications activees.", "success");
      }
    } catch (err) {
      dlog("ERREUR getToken/register :", err.message);
      showToast("Impossible d'activer les notifications : " + err.message, "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dlog]);

  // Idempotent + partage entre le montage (si la permission est deja accordee)
  // et le clic sur la cloche : evite la course ou readyRef n'est pas encore
  // rempli quand l'utilisateur clique juste apres le chargement de la page.
  const readyPromiseRef = useRef(null);
  const ensureReady = useCallback(() => {
    if (!firebaseConfigured || typeof window === "undefined" || !("serviceWorker" in navigator)) {
      dlog("ensureReady() : firebase non configure ou serviceWorker indisponible");
      return Promise.resolve(null);
    }
    if (!readyPromiseRef.current) {
      readyPromiseRef.current = (async () => {
        dlog("ensureReady() : demarrage");
        const messaging = await getMessagingIfSupported();
        dlog("getMessagingIfSupported() ->", Boolean(messaging));
        if (!messaging) return null;
        messagingRef.current = messaging;

        const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        dlog("SW register() ->", reg.installing ? "installing" : reg.waiting ? "waiting" : reg.active ? "active" : "?");
        // `register()` se resout des que le worker est installe, pas forcement actif :
        // getToken()/PushManager.subscribe() exigent un service worker actif, d'ou ce await.
        const registration = await navigator.serviceWorker.ready;
        dlog("SW ready ->", registration.active?.state, registration.active?.scriptURL);
        swRegistrationRef.current = registration;

        onMessage(messaging, (payload) => {
          dlog("onMessage (foreground) recu :", payload);
          const { title, body } = payload.notification || {};
          showToast([title, body].filter(Boolean).join(" - ") || "Nouvelle notification", "success");
        });

        return { messaging, registration };
      })();
    }
    return readyPromiseRef.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dlog]);

  useEffect(() => {
    dlog("Etat au chargement : permission =", typeof Notification !== "undefined" ? Notification.permission : "unsupported");
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    ensureReady().then((ready) => {
      if (ready) registerToken(ready.messaging, ready.registration);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enableNotifications = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    const ready = await ensureReady();
    if (!ready) {
      showToast("Ce navigateur ne supporte pas les notifications push.", "error");
      return;
    }
    const result = await Notification.requestPermission();
    dlog("requestPermission() ->", result);
    setPermission(result);
    if (result === "granted") {
      await registerToken(ready.messaging, ready.registration);
    }
  }, [ensureReady, registerToken, showToast, dlog]);

  return (
    <NotificationsContext.Provider value={{ permission, enableNotifications, showToast, firebaseConfigured }}>
      {children}
      {toast && (
        <div className="toast-stack">
          <div className={"toast " + (toast.type === "success" ? "toast-success" : "toast-error")}>
            {toast.message}
          </div>
        </div>
      )}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications doit etre utilise dans un NotificationsProvider");
  return ctx;
}
