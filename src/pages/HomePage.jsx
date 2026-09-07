import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePaginatedResource } from "../api/useResource";
import BienCard from "../components/BienCard";
import OffersStepper from "../components/OffersStepper";

export default function HomePage() {
  const { t } = useTranslation();
  const { results: recents, loading: recentsLoading } = usePaginatedResource("/biens/", {
    page: 1,
    actif: "true",
  });

  return (
    <div>
      <OffersStepper />

      <section className="container section">
        <div className="section-header">
          <h2>{t("home.recentBiens")}</h2>
          <Link to="/biens" className="btn btn-ghost btn-small">
            {t("home.viewAllBiens")}
          </Link>
        </div>
        {recentsLoading ? (
          <div className="page-loading">{t("common.loading")}</div>
        ) : (
          <div className="bien-grid">
            {recents.slice(0, 8).map((bien) => (
              <BienCard key={bien.reference} bien={bien} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
