import { initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

// Notifications push desactivees sur le frontend web (demande explicite) :
// le bouton cloche reste cache, aucune permission n'est demandee, aucun
// service worker/token FCM n'est enregistre. Le backend (notifications/
// services.py) et les apps mobiles ne sont pas concernes - repasser a
// `true` suffit a tout reactiver cote web, rien d'autre n'a ete touche.
const NOTIFICATIONS_WEB_ENABLED = false;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured =
  NOTIFICATIONS_WEB_ENABLED && Boolean(firebaseConfig.apiKey && firebaseConfig.appId);

const firebaseApp = firebaseConfigured ? initializeApp(firebaseConfig) : null;

/** getMessaging() jette si le navigateur ne supporte pas FCM (Safari < 16, navigation privee...). */
export async function getMessagingIfSupported() {
  if (!firebaseApp) return null;
  if (!(await isSupported())) return null;
  return getMessaging(firebaseApp);
}
