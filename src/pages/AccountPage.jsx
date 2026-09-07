import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Check,
  Copy,
  Gift,
  Mail,
  Phone,
  Save,
  Star,
  User,
  UserCircle,
  Users,
} from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { copyToClipboard } from "../utils/clipboard";

export default function AccountPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("profil");

  const TABS = [
    { key: "profil", label: t("account.tabProfile"), icon: UserCircle },
    { key: "points", label: t("account.tabPoints"), icon: Star },
    { key: "invitation", label: t("account.tabInvite"), icon: Gift },
  ];

  return (
    <div className="container section">
      <div className="section-header">
        <h2>{t("account.title")}</h2>
      </div>
      <div className="account-layout">
        <nav className="account-nav">
          {TABS.map((tabItem) => (
            <button
              key={tabItem.key}
              type="button"
              className={tab === tabItem.key ? "active" : ""}
              onClick={() => setTab(tabItem.key)}
            >
              <tabItem.icon className="icon-sm" />
              {tabItem.label}
            </button>
          ))}
        </nav>

        <div>
          {tab === "profil" && <ProfilTab />}
          {tab === "points" && <PointsTab />}
          {tab === "invitation" && <InvitationTab />}
        </div>
      </div>
    </div>
  );
}

function ProfilTab() {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  const [values, setValues] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    telephone: user?.telephone || "",
    est_gestionnaire: Boolean(user?.est_gestionnaire),
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  function set(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await api.patch("/profil/", values);
      setUser(updated);
      setSaved(true);
    } catch (err) {
      setError(err.message || t("account.updateError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="detail-card">
      <h3>
        <User className="icon-sm" />
        {t("account.personalInfo")}
      </h3>
      <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
        {error && (
          <div className="alert" style={{ marginBottom: "1rem" }}>
            {error}
          </div>
        )}
        <div className="auth-field-row" style={{ marginBottom: "0.9rem" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{t("account.firstName")}</span>
            <input value={values.first_name} onChange={(e) => set("first_name", e.target.value)} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{t("account.lastName")}</span>
            <input value={values.last_name} onChange={(e) => set("last_name", e.target.value)} />
          </label>
        </div>

        <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginBottom: "0.9rem" }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{t("account.email")}</span>
          <div className="field-icon-wrap">
            <Mail className="icon-sm" />
            <input type="email" value={values.email} onChange={(e) => set("email", e.target.value)} />
          </div>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginBottom: "1rem" }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{t("account.phone")}</span>
          <div className="field-icon-wrap">
            <Phone className="icon-sm" />
            <input value={values.telephone} onChange={(e) => set("telephone", e.target.value)} />
          </div>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
          <input
            type="checkbox"
            checked={values.est_gestionnaire}
            onChange={(e) => set("est_gestionnaire", e.target.checked)}
            style={{ width: 16, height: 16 }}
          />
          <span style={{ fontSize: "0.85rem" }}>{t("account.isManager")}</span>
        </label>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saved ? <Check className="icon-sm" /> : <Save className="icon-sm" />}
          {saving ? t("common.saving") : saved ? t("common.saved") : t("common.save")}
        </button>
      </form>
    </div>
  );
}

function PointsTab() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/mes-points/")
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">{t("common.loading")}</div>;

  return (
    <div>
      <div className="points-hero">
        <div>
          <div className="points-hero-label">{t("account.pointsBalance")}</div>
          <div className="points-hero-value">{data?.solde_points ?? 0} pts</div>
        </div>
        <Star size={48} style={{ position: "relative", zIndex: 1, opacity: 0.5 }} />
      </div>

      <div className="detail-card">
        <h3>{t("account.history")}</h3>
        {data?.historique?.length ? (
          <div style={{ marginTop: "0.5rem" }}>
            {data.historique.map((mvt) => (
              <div className="points-history-row" key={mvt.id}>
                <div>
                  <div>
                    {mvt.description ||
                      (mvt.type_mouvement === "gagne" ? t("account.pointsEarned") : t("account.pointsConverted"))}
                  </div>
                  <div className="muted" style={{ fontSize: "0.78rem" }}>
                    {new Date(mvt.date_creation).toLocaleDateString(i18n.language)}
                  </div>
                </div>
                <span className={"points-delta " + (mvt.points >= 0 ? "positive" : "negative")}>
                  {mvt.points >= 0 ? "+" : ""}
                  {mvt.points}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted" style={{ marginTop: "0.5rem" }}>
            {t("account.noHistory")}
          </p>
        )}
      </div>
    </div>
  );
}

function InvitationTab() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const inviteLink = user ? `${window.location.origin}/invite/${user.code_invitation}` : "";

  function copyLink() {
    copyToClipboard(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="detail-card">
      <h3>
        <Users className="icon-sm" />
        {t("account.inviteTitle")}
      </h3>
      <p className="muted" style={{ marginTop: "0.5rem", lineHeight: 1.6 }}>
        {t("account.inviteSubtitle")}
      </p>

      <div style={{ marginTop: "1rem" }}>
        <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{t("account.inviteLink")}</span>
        <div className="invite-box" style={{ marginTop: "0.4rem" }}>
          <span style={{ flex: 1 }}>{inviteLink}</span>
          <button type="button" className="btn btn-small btn-ghost" onClick={copyLink}>
            {copied ? <Check className="icon-sm" /> : <Copy className="icon-sm" />}
            {copied ? t("common.copied") : t("common.copy")}
          </button>
        </div>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{t("account.referralCode")}</span>
        <div className="invite-box" style={{ marginTop: "0.4rem" }}>{user?.code_invitation}</div>
      </div>

      {typeof user?.nb_filleuls === "number" && (
        <p className="muted" style={{ marginTop: "1rem" }}>
          {t("account.referralsCount", { count: user.nb_filleuls })}
        </p>
      )}
    </div>
  );
}
