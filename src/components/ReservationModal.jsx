import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, CalendarCheck, CheckCircle2 } from "lucide-react";
import { api } from "../api/client";
import { formatPrix, localizedField } from "../constants";
import Modal from "./Modal";
import AvailabilityCalendar from "./AvailabilityCalendar";

function estimateMontant(bien, dateDebut, dateFin) {
  if (bien.type_transaction === "vente") return Number(bien.prix);
  if (!dateDebut || !dateFin) return null;

  const start = new Date(dateDebut);
  const end = new Date(dateFin);
  const days = Math.max(1, Math.round((end - start) / 86400000) + 1);
  const prix = Number(bien.prix);

  if (bien.unite_prix === "jour") return prix * days;
  if (bien.unite_prix === "3jours") return prix * Math.ceil(days / 3);
  if (bien.unite_prix === "mois") return prix * Math.max(1, Math.ceil(days / 30));
  return prix;
}

export default function ReservationModal({ bien, onClose }) {
  const { t, i18n } = useTranslation();
  const isLocation = bien.type_transaction === "location";
  const isMonthly = isLocation && bien.unite_prix === "mois";
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const montant = useMemo(() => estimateMontant(bien, dateDebut, dateFin), [bien, dateDebut, dateFin]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (isLocation && (!dateDebut || !dateFin)) {
      setError(t("reservation.missingDates"));
      return;
    }
    if (isLocation && dateFin < dateDebut) {
      setError(t("reservation.invalidDates"));
      return;
    }
    if (isMonthly && bien.statut_disponibilite !== "disponible") {
      setError(t("reservation.monthlyUnavailable"));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        bien: bien.id,
        type_transaction: bien.type_transaction,
        montant_total: montant,
      };
      if (isLocation) {
        payload.date_debut = dateDebut;
        payload.date_fin = dateFin;
      }
      await api.post("/transactions/", payload);
      setSuccess(true);
    } catch (err) {
      setError(err.message || t("reservation.submitError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={isLocation ? t("reservation.titleRent") : t("reservation.titleBuy")} onClose={onClose}>
      {success ? (
        <div className="reservation-success">
          <CheckCircle2 className="icon" />
          <strong>{t("reservation.successTitle")}</strong>
          <p className="muted">{t("reservation.successBody")}</p>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            {t("common.close")}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <p className="muted" style={{ marginBottom: "0.75rem" }}>
            {localizedField(bien, "titre", i18n)}
          </p>

          {error && (
            <div className="alert" style={{ marginBottom: "1rem" }}>
              <AlertCircle className="icon-sm" />
              <span>{error}</span>
            </div>
          )}

          {isLocation && (
            <>
              <div className="auth-field-row" style={{ marginBottom: "0.9rem" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{t("reservation.startDate")}</span>
                  <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} required />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{t("reservation.endDate")}</span>
                  <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} required />
                </label>
              </div>

              {!isMonthly && (
                <AvailabilityCalendar indisponibilites={bien.indisponibilites} focusDate={dateDebut} />
              )}
            </>
          )}

          <div className="reservation-summary">
            <div className="reservation-summary-row">
              <span className="muted">{t("reservation.price")}</span>
              <span>{formatPrix(t, bien.prix, bien.unite_prix)}</span>
            </div>
            {montant != null && (
              <div className="reservation-summary-row">
                <span className="muted">{t("reservation.estimatedAmount")}</span>
                <strong>{formatPrix(t, montant, "forfait")}</strong>
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            <CalendarCheck className="icon-sm" />
            {submitting ? t("reservation.sending") : isLocation ? t("reservation.submitRent") : t("reservation.submitBuy")}
          </button>
        </form>
      )}
    </Modal>
  );
}
