import { useTranslation } from "react-i18next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";

const PHONES = ["20203000", "49214242", "48124242", "36868626", "20161603"];
const EMAIL = "Agharina@gmail.com";
const WEBSITE = "www.Agharina.com";

export default function ContactPage() {
  const { t } = useTranslation();

  return (
    <div>
      <section className="hero" style={{ paddingBottom: "2.5rem" }}>
        <div className="hero-inner">
          <h1>{t("contact.title")}</h1>
          <p>{t("contact.subtitle")}</p>
        </div>
      </section>

      <div className="container section">
        <div className="contact-grid">
          <a className="contact-card" href={`tel:${PHONES[0]}`}>
            <span className="contact-card-icon">
              <Phone className="icon" />
            </span>
            <div>
              <div className="contact-card-label">{t("contact.phoneLabel")}</div>
              <div className="contact-card-value">
                {PHONES.map((p, i) => (
                  <span key={p}>
                    {p}
                    {i < PHONES.length - 1 ? " / " : ""}
                  </span>
                ))}
              </div>
            </div>
          </a>

          <a className="contact-card" href={`https://wa.me/222${PHONES[0]}`} target="_blank" rel="noreferrer">
            <span className="contact-card-icon">
              <MessageCircle className="icon" />
            </span>
            <div>
              <div className="contact-card-label">{t("contact.whatsappLabel")}</div>
              <div className="contact-card-value">{PHONES[0]}</div>
            </div>
          </a>

          <a className="contact-card" href={`mailto:${EMAIL}`}>
            <span className="contact-card-icon">
              <Mail className="icon" />
            </span>
            <div>
              <div className="contact-card-label">{t("contact.emailLabel")}</div>
              <div className="contact-card-value">{EMAIL}</div>
            </div>
          </a>

          <div className="contact-card">
            <span className="contact-card-icon">
              <MapPin className="icon" />
            </span>
            <div>
              <div className="contact-card-label">{t("contact.locationLabel")}</div>
              <div className="contact-card-value">{t("footer.location")}</div>
            </div>
          </div>
        </div>

        <p className="muted" style={{ marginTop: "1.5rem", textAlign: "center" }}>
          {t("contact.website")} : <strong>{WEBSITE}</strong>
        </p>
      </div>
    </div>
  );
}
