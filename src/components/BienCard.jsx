import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bath, BedDouble, ImageOff, Play, MapPin } from "lucide-react";
import { api } from "../api/client";
import { bienTypeLabel, formatPrix, localizedField, occupationStatusLabel } from "../constants";

export default function BienCard({ bien }) {
  const { t, i18n } = useTranslation();
  const titre = localizedField(bien, "titre", i18n);
  const quartierName = bien.quartier ? localizedField(bien.quartier, "nom", i18n) : null;
  const villeName = bien.ville ? localizedField(bien.ville, "nom", i18n) : null;
  const [videoMedia, setVideoMedia] = useState(null);

  useEffect(() => {
    if (bien.photo_principale || !bien.reference) return;
    let cancelled = false;
    api
      .get(`/biens/${bien.reference}/`)
      .then((detail) => {
        if (cancelled) return;
        const firstVideo = detail?.medias?.find((m) => m.type_media === "video");
        if (firstVideo) setVideoMedia(firstVideo);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [bien.photo_principale, bien.reference]);

  return (
    <Link to={`/biens/${bien.reference}`} className={"bien-card" + (bien.vendu ? " bien-card-vendu" : "")}>
      <div className="bien-card-media">
        {bien.vendu && <span className="bien-card-sold-badge">{t("bienDetail.alreadySold")}</span>}
        {bien.unite_prix === "mois" && bien.statut_disponibilite !== "disponible" && (
          <span className="bien-card-sold-badge">{occupationStatusLabel(t, bien.statut_disponibilite)}</span>
        )}
        {bien.photo_principale ? (
          <img src={bien.photo_principale} alt={titre} loading="lazy" />
        ) : videoMedia ? (
          <>
            <video src={videoMedia.fichier} muted />
            <span className="bien-card-video-overlay">
              <Play size={26} color="#fff" fill="#fff" />
            </span>
            <span className="bien-card-video-tag">
              <Play size={11} color="#fff" fill="#fff" />
              {t("common.video")}
            </span>
          </>
        ) : (
          <div className="bien-card-media-placeholder">
            <ImageOff className="icon" />
          </div>
        )}
        <span className="bien-card-badge">{bienTypeLabel(t, bien.type_bien)}</span>
        <span className="bien-card-price-badge">{formatPrix(t, bien.prix, bien.unite_prix)}</span>
      </div>
      <div className="bien-card-body">
        <div className="bien-card-title">{titre}</div>
        <div className="bien-card-location">
          <MapPin className="icon-sm" />
          {[quartierName, villeName].filter(Boolean).join(", ") || t("common.mauritania")}
        </div>
        {(bien.nb_chambres || bien.nb_salles_bain) && (
          <div className="bien-card-meta">
            {bien.nb_chambres ? (
              <span>
                <BedDouble className="icon-sm" />
                {bien.nb_chambres}
              </span>
            ) : null}
            {bien.nb_salles_bain ? (
              <span>
                <Bath className="icon-sm" />
                {bien.nb_salles_bain}
              </span>
            ) : null}
          </div>
        )}
      </div>
    </Link>
  );
}
