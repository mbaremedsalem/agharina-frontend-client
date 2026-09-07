import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import fr from "./locales/fr.json";
import ar from "./locales/ar.json";

export const LANG_STORAGE_KEY = "agharina_client_lang";
export const RTL_LANGS = ["ar"];

export function getStoredLang() {
  return localStorage.getItem(LANG_STORAGE_KEY) || "fr";
}

export function applyDirection(lang) {
  const dir = RTL_LANGS.includes(lang) ? "rtl" : "ltr";
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;
}

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    ar: { translation: ar },
  },
  lng: getStoredLang(),
  fallbackLng: "fr",
  interpolation: { escapeValue: false },
});

applyDirection(i18n.language);

i18n.on("languageChanged", (lang) => {
  localStorage.setItem(LANG_STORAGE_KEY, lang);
  applyDirection(lang);
});

export default i18n;
