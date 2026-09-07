import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, Phone } from "lucide-react";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="site-footer">
      <div className="site-footer-top">
        <div className="site-footer-brand">
          <img src="/logo.jpeg" alt="Agharina" className="brand-mark" />
          <p>{t("footer.description")}</p>
        </div>

        <div className="site-footer-col">
          <span className="site-footer-heading">{t("footer.navHeading")}</span>
          <Link to="/biens">{t("nav.allBiens")}</Link>
          <Link to="/offres">{t("nav.offers")}</Link>
          <Link to="/a-propos">{t("nav.about")}</Link>
          <Link to="/contact">{t("nav.contact")}</Link>
        </div>

        <div className="site-footer-col">
          <span className="site-footer-heading">{t("footer.contactHeading")}</span>
          <a href="tel:20203000">
            <Phone className="icon-sm" /> 20203000
          </a>
          <a href="mailto:Agharina@gmail.com">
            <Mail className="icon-sm" /> Agharina@gmail.com
          </a>
        </div>
      </div>

      <div className="site-footer-inner">
        <span>{t("footer.tagline", { year: new Date().getFullYear() })}</span>
        <span>{t("footer.location")}</span>
      </div>
    </footer>
  );
}
