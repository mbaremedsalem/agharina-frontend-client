import { useTranslation } from "react-i18next";
import { Building2, Gift, Globe, MapPin, ShieldCheck } from "lucide-react";
import { usePaginatedResource, useResource } from "../api/useResource";

export default function AboutPage() {
  const { t } = useTranslation();
  const { count: biensCount } = usePaginatedResource("/biens/", { page: 1, actif: "true" });
  const { items: villes } = useResource("/villes/");

  const FEATURES = [
    { icon: Building2, title: t("about.feature1Title"), text: t("about.feature1Text") },
    { icon: ShieldCheck, title: t("about.feature2Title"), text: t("about.feature2Text") },
    { icon: Gift, title: t("about.feature3Title"), text: t("about.feature3Text") },
    { icon: Globe, title: t("about.feature4Title"), text: t("about.feature4Text") },
  ];

  return (
    <div>
      <section className="hero" style={{ paddingBottom: "2.5rem" }}>
        <div className="hero-inner">
          <h1>{t("about.title")}</h1>
          <p>{t("about.subtitle")}</p>
        </div>
      </section>

      <div className="container section">
        <p className="muted" style={{ maxWidth: 720, lineHeight: 1.7, fontSize: "1rem" }}>
          {t("about.intro")}
        </p>

        <div className="about-stats">
          <div className="about-stat">
            <strong>{biensCount}</strong>
            <span>{t("about.statBiens")}</span>
          </div>
          <div className="about-stat">
            <strong>{villes.length}</strong>
            <span>{t("about.statVilles")}</span>
          </div>
          <div className="about-stat">
            <MapPin className="icon" />
            <span>{t("footer.location")}</span>
          </div>
        </div>

        <div className="section-header" style={{ marginTop: "2.5rem" }}>
          <h2>{t("about.featuresTitle")}</h2>
        </div>

        <div className="about-features-grid">
          {FEATURES.map((f) => (
            <div className="detail-card" key={f.title}>
              <div className="about-feature-icon">
                <f.icon className="icon" />
              </div>
              <h3>{f.title}</h3>
              <p className="muted" style={{ lineHeight: 1.6 }}>
                {f.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
