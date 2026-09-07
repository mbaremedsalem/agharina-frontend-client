import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, Megaphone, Percent } from "lucide-react";
import { useResource } from "../api/useResource";
import { localizedField } from "../constants";

export default function OffresPage() {
  const { t, i18n } = useTranslation();
  const ArrowIcon = i18n.dir() === "rtl" ? ArrowLeft : ArrowRight;
  const { items: offres, loading } = useResource("/offres/");
  const { items: biens } = useResource("/biens/", { actif: "true" });

  const bienRefById = useMemo(() => {
    const map = new Map();
    biens.forEach((b) => map.set(b.id, b));
    return map;
  }, [biens]);

  return (
    <div className="container section">
      <div className="section-header">
        <h2>
          <Megaphone className="icon-sm" style={{ display: "inline", verticalAlign: "-3px", marginInlineEnd: 8 }} />
          {t("offersPage.title")}
        </h2>
      </div>

      {loading ? (
        <div className="page-loading">{t("common.loading")}</div>
      ) : offres.length === 0 ? (
        <div className="empty-state">
          <Megaphone className="icon" />
          {t("offersPage.empty")}
        </div>
      ) : (
        <div className="offer-grid">
          {offres.map((offre) => {
            const bien = offre.bien ? bienRefById.get(offre.bien) : null;
            const CardTag = bien ? Link : "div";
            return (
              <CardTag
                key={offre.id}
                to={bien ? `/biens/${bien.reference}` : undefined}
                className="offer-card"
              >
                <span className="offer-card-badge">
                  {offre.reduction_pourcentage ? (
                    <>
                      <Percent className="icon-sm" style={{ display: "inline", verticalAlign: "-2px" }} />{" "}
                      {offre.reduction_pourcentage}%
                    </>
                  ) : (
                    t("offersPage.promotionFallback")
                  )}
                </span>
                <h3>{localizedField(offre, "titre", i18n)}</h3>
                {localizedField(offre, "description", i18n) && <p>{localizedField(offre, "description", i18n)}</p>}
                {bien && (
                  <p
                    style={{
                      marginTop: "0.5rem",
                      fontWeight: 600,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                  >
                    {localizedField(bien, "titre", i18n)} <ArrowIcon className="icon-sm" />
                  </p>
                )}
              </CardTag>
            );
          })}
        </div>
      )}
    </div>
  );
}
