// Service worker Firebase Cloud Messaging : gere les notifications recues
// quand l'onglet du site n'est pas au premier plan (ou est ferme).
//
// Un service worker est un fichier statique servi tel quel : il ne passe PAS
// par Vite et ne peut donc pas lire le `.env` (import.meta.env). Il faut donc
// recopier ICI les memes valeurs que celles mises dans `.env` (VITE_FIREBASE_*).
// Ce ne sont pas des secrets (voir le commentaire dans `.env`), elles peuvent
// rester en dur dans ce fichier commite.
console.log("[sw] script en cours de chargement...");

importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

try {
  firebase.initializeApp({
    apiKey: "AIzaSyB2uek2f4HGDee6KXYrtkaWetsVJyyBn4g",
    authDomain: "akarena.firebaseapp.com",
    projectId: "akarena",
    storageBucket: "akarena.firebasestorage.app",
    messagingSenderId: "694884663195",
    appId: "1:694884663195:web:5942545931505bd720eb3e",
  });
  console.log("[sw] firebase.initializeApp() OK");
} catch (err) {
  console.error("[sw] firebase.initializeApp() a ECHOUE :", err);
}

// Force ce service worker a devenir actif immediatement, sans attendre la
// fermeture de tous les onglets ouverts : sinon, apres chaque modification de
// ce fichier, l'ANCIENNE version reste active (et controle toujours la page)
// jusqu'a ce que l'utilisateur ferme completement le navigateur - ce qui a
// cause des notifications "envoyees avec succes" par le backend mais jamais
// affichees, tant que l'ancien SW (config invalide) etait encore actif.
self.addEventListener("install", (event) => {
  console.log("[sw] install");
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  console.log("[sw] activate");
  event.waitUntil(self.clients.claim());
});

// Diagnostic : ecoute BRUTE de l'evenement push du navigateur, independante
// de la librairie firebase-messaging. Si ce log n'apparait jamais quand le
// backend envoie une notification, le probleme est en amont de notre code
// (le push n'arrive meme pas jusqu'au navigateur : permission revoquee,
// abonnement push expire, "Concentration"/Focus Assist Windows, etc.).
self.addEventListener("push", (event) => {
  console.log("[sw] RAW push event recu :", event.data ? event.data.text() : "(pas de data)");
});

let messaging;
try {
  messaging = firebase.messaging();
  console.log("[sw] firebase.messaging() OK");
} catch (err) {
  console.error("[sw] firebase.messaging() a ECHOUE :", err);
}

if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log("[sw] onBackgroundMessage recu :", JSON.stringify(payload));
    const { title, body, image } = payload.notification || {};
    self.registration
      .showNotification(title || "Agharina", {
        body,
        image,
        icon: "/logo.jpeg",
        data: payload.data || {},
      })
      .then(() => console.log("[sw] showNotification() affichee avec succes"))
      .catch((err) => console.error("[sw] showNotification() a ECHOUE :", err));
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const bienReference = event.notification.data?.bien_reference;
  const url = bienReference ? `/biens/${bienReference}` : "/";
  event.waitUntil(self.clients.openWindow(url));
});

console.log("[sw] script charge jusqu'au bout, sans exception.");
