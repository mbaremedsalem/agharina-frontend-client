import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Bath,
  BedDouble,
  BadgeCheck,
  Building2,
  CalendarCheck,
  CalendarDays,
  Check,
  Copy,
  Layers,
  MapPin,
  Megaphone,
  Phone,
  Ruler,
  Sofa,
  Tag,
  Users,
} from "lucide-react";
import { api } from "../api/client";
import { useResource } from "../api/useResource";
import { useAuth } from "../context/AuthContext";
import MediaGallery from "../components/MediaGallery";
import AvailabilityCalendar from "../components/AvailabilityCalendar";
import BienMap from "../components/BienMap";
import ReservationModal from "../components/ReservationModal";
import { bienTypeLabel, transactionTypeLabel, formatPrix, localizedField, occupationStatusLabel } from "../constants";
import { copyToClipboard } from "../utils/clipboard";

export default function BienDetailPage() {
  const { t, i18n } = useTranslation();
  const { reference } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [bien, setBien] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReservation, setShowReservation] = useState(false);
  const [copied, setCopied] = useState(false);

  const { items: villes } = useResource("/villes/");
  const { items: quartiers } = useResource("/quartiers/");
  const { items: offres } = useResource(bien ? "/offres/" : null, bien ? { bien: bien.id } : undefined);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get(`/biens/${reference}/`)
      .then((data) => {
        if (!cancelled) setBien(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || t("bienDetail.notFound"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  if (loading) return <div className="page-loading">{t("common.loading")}</div>;

  if (error || !bien) {
    return (
      <div className="container section">
        <div className="empty-state">
          <Building2 className="icon" />
          {error || t("bienDetail.notFound")}
          <Link to="/biens" className="btn btn-primary btn-small">
            {t("bienDetail.backToBiens")}
          </Link>
        </div>
      </div>
    );
  }

  const villeObj = villes.find((v) => v.id === bien.ville);
  const quartierObj = quartiers.find((q) => q.id === bien.quartier);
  const villeName = villeObj && localizedField(villeObj, "nom", i18n);
  const quartierName = quartierObj && localizedField(quartierObj, "nom", i18n);

  function gestionnaireName(g) {
    return [g.first_name, g.last_name].filter(Boolean).join(" ") || g.username;
  }

  function handleReserveClick() {
    if (!isAuthenticated) {
      navigate("/connexion", { state: { from: `/biens/${reference}` } });
      return;
    }
    setShowReservation(true);
  }

  function handleCopyReference() {
    copyToClipboard(bien.reference).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="container section">
      {bien.vendu && (
        <div
          className="alert"
          style={{ background: "var(--danger-light)", color: "var(--danger-text)", border: "none", marginBottom: "1rem" }}
        >
          <BadgeCheck className="icon-sm" />
          <span>
            <strong>{t("bienDetail.soldTitle")}</strong> — {t("bienDetail.soldBody")}
          </span>
        </div>
      )}

      {offres.length > 0 && (
        <div
          className="alert"
          style={{ background: "var(--primary-light)", color: "var(--primary-text)", border: "none", marginBottom: "1rem" }}
        >
          <Megaphone className="icon-sm" />
          <span>
            {localizedField(offres[0], "titre", i18n)}
            {offres[0].reduction_pourcentage
              ? ` — ${t("offersStepper.reduction", { percent: offres[0].reduction_pourcentage })}`
              : ""}
          </span>
        </div>
      )}

      <div className="detail-header">
        <div>
          <div className="detail-title">{localizedField(bien, "titre", i18n)}</div>
          <div className="detail-location">
            <MapPin className="icon-sm" />
            {[quartierName, villeName].filter(Boolean).join(", ") || t("common.mauritania")}
            <button
              type="button"
              className="reference-copy"
              onClick={handleCopyReference}
              title={copied ? t("common.copied") : t("common.copy")}
            >
              <span className="muted" style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>
                {bien.reference}
              </span>
              {copied ? (
                <Check className="icon-sm" style={{ color: "var(--success-text)" }} />
              ) : (
                <Copy className="icon-sm" />
              )}
            </button>
          </div>
        </div>
        {Number(bien.prix) > 0 && (
          <div className="detail-price">
            {formatPrix(t, bien.prix, bien.unite_prix)}
            <div>
              <span>{transactionTypeLabel(t, bien.type_transaction)}</span>
            </div>
          </div>
        )}
      </div>

      <MediaGallery medias={bien.medias} />

      <div className="detail-layout">
        <div>
          <div className="detail-card">
            <h3>
              <Tag className="icon-sm" />
              {t("bienDetail.characteristics")}
            </h3>
            <div className="spec-grid">
              <div className="spec-item">
                <Building2 className="icon-sm" />
                <strong>{bienTypeLabel(t, bien.type_bien)}</strong>
                <span>{t("bienDetail.bienType")}</span>
              </div>
              {bien.nb_chambres ? (
                <div className="spec-item">
                  <BedDouble className="icon-sm" />
                  <strong>{bien.nb_chambres}</strong>
                  <span>{t("bienDetail.rooms")}</span>
                </div>
              ) : null}
              {bien.nb_salles_bain ? (
                <div className="spec-item">
                  <Bath className="icon-sm" />
                  <strong>{bien.nb_salles_bain}</strong>
                  <span>{t("bienDetail.bathrooms")}</span>
                </div>
              ) : null}
              {bien.nb_etages ? (
                <div className="spec-item">
                  <Layers className="icon-sm" />
                  <strong>{bien.nb_etages}</strong>
                  <span>{t("bienDetail.floors")}</span>
                </div>
              ) : null}
              {bien.meuble ? (
                <div className="spec-item">
                  <Sofa className="icon-sm" />
                  <strong>{t("common.yes")}</strong>
                  <span>{t("bienDetail.furnished")}</span>
                </div>
              ) : null}
              {bien.detail_terrain?.superficie_m2 ? (
                <div className="spec-item">
                  <Ruler className="icon-sm" />
                  <strong>{bien.detail_terrain.superficie_m2} m²</strong>
                  <span>{t("bienDetail.area")}</span>
                </div>
              ) : null}
              {bien.detail_terrain?.longueur_m ? (
                <div className="spec-item">
                  <Ruler className="icon-sm" />
                  <strong>{bien.detail_terrain.longueur_m} m</strong>
                  <span>{t("bienDetail.length")}</span>
                </div>
              ) : null}
              {bien.detail_terrain?.largeur_m ? (
                <div className="spec-item">
                  <Ruler className="icon-sm" />
                  <strong>{bien.detail_terrain.largeur_m} m</strong>
                  <span>{t("bienDetail.width")}</span>
                </div>
              ) : null}
              {bien.detail_terrain?.base_m ? (
                <div className="spec-item">
                  <Ruler className="icon-sm" />
                  <strong>{bien.detail_terrain.base_m} m</strong>
                  <span>{t("bienDetail.base")}</span>
                </div>
              ) : null}
              {bien.detail_terrain?.hauteur_m ? (
                <div className="spec-item">
                  <Ruler className="icon-sm" />
                  <strong>{bien.detail_terrain.hauteur_m} m</strong>
                  <span>{t("bienDetail.height")}</span>
                </div>
              ) : null}
              {bien.detail_terrain?.hypotenuse_m ? (
                <div className="spec-item">
                  <Ruler className="icon-sm" />
                  <strong>{bien.detail_terrain.hypotenuse_m} m</strong>
                  <span>{t("bienDetail.hypotenuse")}</span>
                </div>
              ) : null}
              {bien.detail_terrain?.diagonale_m ? (
                <div className="spec-item">
                  <Ruler className="icon-sm" />
                  <strong>{bien.detail_terrain.diagonale_m} m</strong>
                  <span>{t("bienDetail.diagonal")}</span>
                </div>
              ) : null}
              {bien.detail_ceremonie?.capacite_personnes ? (
                <div className="spec-item">
                  <Users className="icon-sm" />
                  <strong>{bien.detail_ceremonie.capacite_personnes}</strong>
                  <span>{t("bienDetail.capacity")}</span>
                </div>
              ) : null}
            </div>
          </div>

          {localizedField(bien, "description", i18n) && (
            <div className="detail-card">
              <h3>{t("bienDetail.description")}</h3>
              <p className="muted" style={{ lineHeight: 1.6, whiteSpace: "pre-line" }}>
                {localizedField(bien, "description", i18n)}
              </p>
            </div>
          )}

          {bien.detail_ceremonie?.avec_service && (
            <div className="detail-card">
              <h3>{t("bienDetail.serviceIncluded")}</h3>
              <p className="muted" style={{ lineHeight: 1.6 }}>
                {localizedField(bien.detail_ceremonie, "description_service", i18n) ||
                  t("bienDetail.serviceIncludedFallback")}
              </p>
            </div>
          )}

          {(bien.detail_terrain?.titre_foncier ||
            bien.detail_terrain?.numero_lot ||
            bien.detail_terrain?.moughataa) && (
            <div className="detail-card">
              <h3>{t("bienDetail.landInfo")}</h3>
              {bien.detail_terrain.numero_lot && (
                <p className="muted">{t("bienDetail.landLot", { numero: bien.detail_terrain.numero_lot })}</p>
              )}
              {bien.detail_terrain.moughataa && (
                <p className="muted">{t("bienDetail.landMoughataa", { moughataa: bien.detail_terrain.moughataa })}</p>
              )}
              {bien.detail_terrain.titre_foncier && (
                <p className="muted">{t("bienDetail.landTitle", { titre: bien.detail_terrain.titre_foncier })}</p>
              )}
              <p className="muted">
                {bien.detail_terrain.borne ? t("bienDetail.landBounded") : t("bienDetail.landNotBounded")}
              </p>
            </div>
          )}

          {bien.equipements?.length > 0 && (
            <div className="detail-card">
              <h3>{t("bienDetail.equipments")}</h3>
              <div className="equip-grid">
                {bien.equipements.map((eq) => (
                  <div className="equip-chip" key={eq.id}>
                    <Check className="icon-sm" style={{ color: "var(--success-text)" }} />
                    {localizedField(eq, "nom", i18n)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {bien.type_transaction === "location" && bien.unite_prix !== "mois" && (
            <div className="detail-card">
              <h3>
                <CalendarDays className="icon-sm" />
                {t("bienDetail.availability")}
              </h3>
              <AvailabilityCalendar indisponibilites={bien.indisponibilites} />
            </div>
          )}

          {bien.unite_prix === "mois" && (
            <div className="detail-card">
              <h3>
                <CalendarDays className="icon-sm" />
                {t("bienDetail.availability")}
              </h3>
              <div
                className="alert"
                style={{
                  background:
                    bien.statut_disponibilite === "disponible" ? "var(--success-light)" : "var(--warning-light)",
                  color: bien.statut_disponibilite === "disponible" ? "var(--success-text)" : "var(--warning-text)",
                  border: "none",
                }}
              >
                <BadgeCheck className="icon-sm" />
                <span>{occupationStatusLabel(t, bien.statut_disponibilite)}</span>
              </div>
            </div>
          )}

          <div className="detail-card">
            <h3>
              <MapPin className="icon-sm" />
              {t("bienDetail.location")}
            </h3>
            {localizedField(bien, "adresse_complete", i18n) && (
              <p className="muted" style={{ marginBottom: "0.75rem" }}>
                {localizedField(bien, "adresse_complete", i18n)}
              </p>
            )}
            <BienMap biens={[bien]} height={360} defaultZoom={15} />
          </div>
        </div>

        <div>
          <div className="sidebar-card">
            {bien.vendu ? (
              <button type="button" className="btn btn-block" disabled>
                <BadgeCheck className="icon-sm" />
                {t("bienDetail.alreadySold")}
              </button>
            ) : bien.unite_prix === "mois" && bien.statut_disponibilite !== "disponible" ? (
              <button type="button" className="btn btn-block" disabled>
                <BadgeCheck className="icon-sm" />
                {t("bienDetail.reserveUnavailable")}
              </button>
            ) : (
              <button type="button" className="btn btn-primary btn-block" onClick={handleReserveClick}>
                <CalendarCheck className="icon-sm" />
                {bien.type_transaction === "location" ? t("bienDetail.reserveBien") : t("bienDetail.requestPurchase")}
              </button>
            )}
          </div>

          {bien.gestionnaires?.length > 0 ? (
            bien.gestionnaires.map((g) => (
              <div className="sidebar-card" key={g.id}>
                <div className="contact-row">
                  <div className="contact-avatar">{gestionnaireName(g).charAt(0).toUpperCase()}</div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{gestionnaireName(g)}</div>
                    <div className="muted" style={{ fontSize: "0.8rem" }}>
                      {t("bienDetail.managerLabel")}
                    </div>
                  </div>
                </div>
                {g.telephone && (
                  <a href={`tel:${g.telephone}`} className="btn btn-primary btn-block">
                    <Phone className="icon-sm" />
                    {g.telephone}
                  </a>
                )}
              </div>
            ))
          ) : (
            <div className="sidebar-card">
              <div className="contact-row">
                <div className="contact-avatar">?</div>
                <div>
                  <div style={{ fontWeight: 700 }}>{t("bienDetail.managerFallback")}</div>
                  <div className="muted" style={{ fontSize: "0.8rem" }}>
                    {t("bienDetail.managerLabel")}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showReservation && <ReservationModal bien={bien} onClose={() => setShowReservation(false)} />}
    </div>
  );
}
