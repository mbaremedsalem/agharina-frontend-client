import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Megaphone } from "lucide-react";
import { useResource } from "../api/useResource";
import { localizedField } from "../constants";

const SLIDE_DURATION = 10000;

export default function OffersStepper() {
  const { t, i18n } = useTranslation();
  const PrevIcon = i18n.dir() === "rtl" ? ChevronRight : ChevronLeft;
  const NextIcon = i18n.dir() === "rtl" ? ChevronLeft : ChevronRight;
  const { items: offres, loading } = useResource("/offres/");
  const { items: biens } = useResource("/biens/", { actif: "true" });
  const [index, setIndex] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const timerRef = useRef(null);

  const count = offres.length;

  useEffect(() => {
    if (count <= 1) return undefined;
    timerRef.current = setTimeout(() => {
      setIndex((i) => (i + 1) % count);
      setProgressKey((k) => k + 1);
    }, SLIDE_DURATION);
    return () => clearTimeout(timerRef.current);
  }, [index, count]);

  if (loading || count === 0) return null;

  function goTo(i) {
    clearTimeout(timerRef.current);
    setIndex(((i % count) + count) % count);
    setProgressKey((k) => k + 1);
  }

  return (
    <section className="offers-stepper">
      {offres.map((offre, i) => {
        const bien = offre.bien ? biens.find((b) => b.id === offre.bien) : null;
        const linkTo = bien ? `/biens/${bien.reference}` : "/offres";

        return (
          <div key={offre.id} className={"offers-stepper-slide" + (i === index ? " active" : "")}>
            {offre.image ? (
              <img src={offre.image} alt="" />
            ) : (
              <div className="offers-stepper-slide-noimg" />
            )}
            <div className="offers-stepper-overlay" />
            <div className="offers-stepper-content">
              <span className="offers-stepper-badge">
                <Megaphone className="icon-sm" />
                {offre.reduction_pourcentage
                  ? t("offersStepper.reduction", { percent: offre.reduction_pourcentage })
                  : t("offersStepper.badgeFallback")}
              </span>
              <h2>{localizedField(offre, "titre", i18n)}</h2>
              {localizedField(offre, "description", i18n) && <p>{localizedField(offre, "description", i18n)}</p>}
              <Link to={linkTo} className="btn btn-primary" style={{ marginTop: "1.1rem" }}>
                {bien ? t("offersStepper.viewBien") : t("offersStepper.viewOffers")}
              </Link>
            </div>
          </div>
        );
      })}

      {count > 1 && (
        <>
          <button
            type="button"
            className="offers-stepper-nav offers-stepper-prev"
            onClick={() => goTo(index - 1)}
            aria-label={t("offersStepper.prevOffer")}
          >
            <PrevIcon color="#fff" />
          </button>
          <button
            type="button"
            className="offers-stepper-nav offers-stepper-next"
            onClick={() => goTo(index + 1)}
            aria-label={t("offersStepper.nextOffer")}
          >
            <NextIcon color="#fff" />
          </button>

          <div className="offers-stepper-dots">
            {offres.map((offre, i) => (
              <button
                key={offre.id}
                type="button"
                className={"offers-stepper-dot" + (i < index ? " done" : "")}
                onClick={() => goTo(i)}
                aria-label={t("offersStepper.goToOffer", { n: i + 1 })}
              >
                {i === index && (
                  <span
                    key={progressKey}
                    className="offers-stepper-dot-fill"
                    style={{ animation: `stepper-progress ${SLIDE_DURATION}ms linear forwards` }}
                  />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
