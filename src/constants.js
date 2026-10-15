/** Image affichee a la place d'une photo quand un bien/espace n'en a aucune. */
export const DEFAULT_BIEN_IMAGE = "https://admin-akarina.akarina.shop/media/offres/home.jpeg";

export function bienTypeLabel(t, type) {
  return t(`bienTypes.${type}`, { defaultValue: type });
}

export function bienTypeOptions(t) {
  return [
    { value: "", label: t("bienTypes.all") },
    { value: "appartement", label: t("bienTypes.appartement") },
    { value: "duplexe", label: t("bienTypes.duplexe") },
    { value: "terrain", label: t("bienTypes.terrain") },
    { value: "commercial", label: t("bienTypes.commercial") },
    { value: "ceremonie", label: t("bienTypes.ceremonie") },
  ];
}

export function transactionTypeLabel(t, type) {
  return t(`transactionTypes.${type}`, { defaultValue: type });
}

export function transactionTypeOptions(t) {
  return [
    { value: "", label: t("transactionTypes.any") },
    { value: "vente", label: t("transactionTypes.vente") },
    { value: "location", label: t("transactionTypes.location") },
  ];
}

/** Retourne le champ `${field}_ar` d'un objet (offre, bien...) quand le site est en arabe, sinon la version francaise. */
export function localizedField(item, field, i18n) {
  if (i18n.language?.startsWith("ar")) {
    return item[`${field}_ar`] || item[field];
  }
  return item[field];
}

export function occupationStatusLabel(t, statut) {
  return t(`occupationStatus.${statut}`, { defaultValue: statut });
}

export function formatPrix(t, prix, unite) {
  const n = Number(prix);
  const formatted = Number.isFinite(n) ? n.toLocaleString("fr-FR") : prix;
  const suffix = unite && unite !== "forfait" ? t(`priceUnits.${unite}`, { defaultValue: "" }) : "";
  return `${formatted} ${t("common.currency")}${suffix ? " " + suffix : ""}`;
}
